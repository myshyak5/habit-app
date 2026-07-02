# backend/habits/views.py

from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from datetime import date
from .models import Habit
from .serializers import HabitSerializer
from django.apps import apps


class HabitViewSet(viewsets.ModelViewSet):
    serializer_class = HabitSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post', 'put', 'patch', 'delete']

    def get_queryset(self):
        return Habit.objects.filter(user=self.request.user, is_active=True).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def update(self, request, *args, **kwargs):
        """Обновление привычки (включая отметку выполнения)"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        old_dates = set(instance.completed_dates or [])
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        updated_instance = serializer.save()
        
        new_dates = set(updated_instance.completed_dates or [])
        today = date.today().isoformat()
        user = request.user
        
        if today in new_dates and today not in old_dates:
            xp = updated_instance.xp_reward
            gold = xp // 2
            user.total_completed += 1
            user.gold += gold
            user.add_experience(xp)
            user.save()
            print(f"✅ Выполнено: +{xp} XP, +{gold} золота")

        elif today in old_dates and today not in new_dates:
            xp = updated_instance.xp_reward
            gold = xp // 2
            user.gold = max(0, user.gold - gold)
            user.add_experience(-xp)
            user.total_completed = max(0, user.total_completed - 1)
            user.save()
            print(f"❌ Отменено: -{xp} XP, -{gold} золота")
            # ❌ НЕТ ПЕРЕСЧЁТА ЗАДАНИЙ!
        
        response_data = serializer.data
        response_data.update({
            'gold': user.gold,
            'experience': user.experience,
            'level': user.level,
            'total_completed': user.total_completed,
            'is_completed_today': today in new_dates
        })
        
        return Response(response_data)

# backend/habits/views.py

    def destroy(self, request, *args, **kwargs):
        """Удаление привычки (мягкое удаление) — убирает ТОЛЬКО за сегодня"""
        from django.apps import apps
        from datetime import date
        
        instance = self.get_object()
        user = request.user
        today = date.today().isoformat()
        
        completed_dates = instance.completed_dates or []
        is_completed_today = today in completed_dates
        
        # 1. Списываем опыт и золото за сегодня
        if is_completed_today:
            xp = instance.xp_reward
            gold = xp // 2
            user.gold = max(0, user.gold - gold)
            user.add_experience(-xp)
            user.total_completed = max(0, user.total_completed - 1)
            user.save()
            print(f"🗑️ Удалено за сегодня: -{xp} XP, -{gold} золота")
        
        # 2. Мягкое удаление
        instance.is_active = False
        instance.save()
        
        # 3. 🔥 ОТКАТ ПРОГРЕССА В ЕЖЕДНЕВНЫХ ЗАДАНИЯХ (ТОЛЬКО ЗА СЕГОДНЯ)
        if is_completed_today:
            try:
                DailyQuest = apps.get_model('daily_quests', 'DailyQuest')
                today_obj = date.today()
                
                quest, created = DailyQuest.objects.get_or_create(user=user, date=today_obj)
                
                # Откатываем прогресс на 1 (только за сегодня)
                quest.quest_1_progress = max(0, quest.quest_1_progress - 1)
                if instance.xp_reward >= 40:
                    quest.quest_2_progress = max(0, quest.quest_2_progress - 1)
                
                # Пересчитываем quest_3_progress (серия из 5)
                quest.quest_3_progress = quest.quest_1_progress
                
                # Обновляем статусы
                quest.quest_1_completed = quest.quest_1_progress >= 3
                quest.quest_2_completed = quest.quest_2_progress >= 1
                quest.quest_3_completed = quest.quest_3_progress >= 5
                quest.all_completed = (
                    quest.quest_1_completed and 
                    quest.quest_2_completed and 
                    quest.quest_3_completed
                )
                
                quest.save()
                print(f"📋 Откат прогресса за сегодня: quest_1={quest.quest_1_progress}")
                
            except Exception as e:
                print(f"⚠️ Ошибка отката прогресса: {e}")
        
        return Response(
            {
                'message': 'Привычка удалена',
                'xp_removed': xp if is_completed_today else 0,
                'gold_removed': gold if is_completed_today else 0,
                'total_completed': user.total_completed,
            },
            status=200
        )