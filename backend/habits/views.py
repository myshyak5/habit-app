# habits/views.py

from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from datetime import date
from .models import Habit
from .serializers import HabitSerializer
from daily_quests.models import DailyQuest

class HabitViewSet(viewsets.ModelViewSet):
    serializer_class = HabitSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post', 'put', 'patch', 'delete']
    
    # ✅ ДОБАВЛЯЕМ ФЛАГ
    _updating_quests = False

    def get_queryset(self):
        return Habit.objects.filter(user=self.request.user, is_active=True)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def update(self, request, *args, **kwargs):
        print(f"🔄 UPDATE вызван для привычки {kwargs.get('pk')}")
        """Обновление привычки (включая отметку выполнения)"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Сохраняем старые даты ДО обновления
        old_dates = set(instance.completed_dates or [])
        print(f"📅 Старые даты: {old_dates}")
        
        # Обновляем привычку через сериализатор
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        # Сохраняем и получаем обновлённый объект
        updated_instance = serializer.save()
        
        # Получаем новые даты ПОСЛЕ обновления
        new_dates = set(updated_instance.completed_dates or [])
        print(f"📅 Новые даты: {new_dates}")
        
        today = date.today().isoformat()
        print(f"📅 Сегодня: {today}")
        user = request.user
        
        # ---- ЛОГИКА НАЧИСЛЕНИЯ ОПЫТА ----
        # Если привычка ТОЛЬКО ЧТО выполнена (есть сегодня, не было раньше)
        if today in new_dates and today not in old_dates:
            xp = updated_instance.xp_reward
            gold = xp // 2
            user.total_completed += 1
            user.gold += gold
            user.add_experience(xp)
            print(f"✅ Привычка выполнена: +{xp} XP, +{gold} золота")
            
            # ✅ ОБНОВЛЯЕМ КВЕСТЫ (с защитой от повторного вызова)
            if not self._updating_quests:
                self._updating_quests = True
                self._update_daily_quests(user)
                self._updating_quests = False

        # Если привычка ТОЛЬКО ЧТО отменена (была сегодня, теперь нет)
        elif today in old_dates and today not in new_dates:
            xp = updated_instance.xp_reward
            gold = xp // 2
            user.gold = max(0, user.gold - gold)
            user.add_experience(-xp)
            print(f"↩️ Привычка отменена: -{xp} XP, -{gold} золота")
            
            # ✅ ОБНОВЛЯЕМ КВЕСТЫ (с защитой от повторного вызова)
            if not self._updating_quests:
                self._updating_quests = True
                self._update_daily_quests(user)
                self._updating_quests = False
        else:
            # Если ничего не изменилось, просто сохраняем пользователя
            user.save()
            print(f"⏭️ Ничего не изменилось для привычки {instance.id}")
        
        # ✅ ВОЗВРАЩАЕМ ОБНОВЛЁННУЮ ПРИВЫЧКУ
        response_data = serializer.data
        response_data.update({
            'gold': user.gold,
            'experience': user.experience,
            'level': user.level,
            'is_completed_today': today in new_dates
        })
        
        return Response(response_data)

    def _update_daily_quests(self, user):
        import traceback
        print("🔧 _update_daily_quests вызван")
        print("".join(traceback.format_stack()))
        from datetime import date
        from daily_quests.models import DailyQuest
        
        print(f"🔧 _update_daily_quests вызван")
        
        today = date.today()
        
        # ✅ УДАЛЯЕМ СТАРЫЙ КВЕСТ И СОЗДАЁМ НОВЫЙ (ЧИСТЫЙ!)
        DailyQuest.objects.filter(user=user, date=today).delete()
        quest = DailyQuest.objects.create(
            user=user,
            date=today,
            quest_1_progress=0,
            quest_2_progress=0,
            quest_3_progress=0,
            quest_1_completed=False,
            quest_2_completed=False,
            quest_3_completed=False,
            all_completed=False,
            rewarded=False
        )
        
        print(f"📊 Создан новый квест для {user.username}")
        
        # ---- ПОЛУЧАЕМ ВСЕ ВЫПОЛНЕННЫЕ СЕГОДНЯ ПРИВЫЧКИ ----
        today_str = date.today().isoformat()
        habits = Habit.objects.filter(user=user, is_active=True)
        
        completed_habits = []
        for h in habits:
            if today_str in (h.completed_dates or []):
                completed_habits.append({
                    'id': h.id,
                    'xp': h.xp_reward
                })
        
        print(f"📋 Выполнено сегодня привычек: {len(completed_habits)}")
        for h in completed_habits:
            print(f"   - Привычка {h['id']}: {h['xp']} XP")
        
        # ---- ПЕРЕСЧИТЫВАЕМ ВСЕ КВЕСТЫ ----
        quest.quest_1_progress = len(completed_habits)
        quest.quest_1_completed = quest.quest_1_progress >= 3
        
        quest.quest_2_progress = sum(1 for h in completed_habits if h['xp'] >= 40)
        quest.quest_2_completed = quest.quest_2_progress >= 1
        
        quest.quest_3_progress = len(completed_habits)
        quest.quest_3_completed = quest.quest_3_progress >= 5
        
        # ---- ПРОВЕРЯЕМ, ВСЕ ЛИ ЗАДАНИЯ ВЫПОЛНЕНЫ ----
        if quest.quest_1_completed and quest.quest_2_completed and quest.quest_3_completed:
            total_gold = 45
            total_xp = 90
            user.gold += total_gold
            user.add_experience(total_xp)
            quest.rewarded = True
            quest.all_completed = True
            user.save()
            print(f"🎉 Все квесты выполнены! +{total_xp} XP, +{total_gold} золота")
        
        quest.save()
        print(f"📊 ПОСЛЕ пересчёта: quest_1={quest.quest_1_progress}, quest_2={quest.quest_2_progress}, quest_3={quest.quest_3_progress}")
    

    def destroy(self, request, *args, **kwargs):
        """Удаление привычки (мягкое удаление)"""
        instance = self.get_object()
        user = request.user
        today = date.today().isoformat()
        
        completed_dates = instance.completed_dates or []
        is_completed_today = today in completed_dates
        
        instance.is_active = False
        instance.save()
        
        if is_completed_today:
            xp = instance.xp_reward
            gold = xp // 2
            user.gold = max(0, user.gold - gold)
            user.add_experience(-xp)
            
            # Пересчитываем квесты
            if not self._updating_quests:
                self._updating_quests = True
                self._update_daily_quests(user)
                self._updating_quests = False
            
            return Response(
                {
                    'message': 'Привычка удалена, опыт за сегодня списан',
                    'xp_removed': xp,
                    'gold_removed': gold,
                    'new_experience': user.experience,
                    'new_gold': user.gold,
                    'new_level': user.level
                },
                status=status.HTTP_200_OK
            )
        
        return Response(
            {'message': 'Привычка удалена'},
            status=status.HTTP_200_OK
        )