from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Habit
from .serializers import HabitSerializer
from django.apps import apps
from datetime import date
from daily_quests.views import recalculate_quest_progress

class HabitViewSet(viewsets.ModelViewSet):
    serializer_class = HabitSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post', 'put', 'patch', 'delete']

    def get_queryset(self):
        return Habit.objects.filter(
            user=self.request.user, 
            is_active=True
        ).order_by('-id')

    @action(detail=False, methods=['get'], url_path='all')
    def list_all(self, request):
        habits = Habit.objects.filter(
            user=self.request.user
        ).order_by('-id')
        serializer = self.get_serializer(habits, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='stats')
    def get_stats(self, request):
        habits = Habit.objects.filter(user=request.user)
        total_completed = 0
        for habit in habits:
            total_completed += len(habit.completed_dates or [])
        return Response({'total_completed': total_completed})

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        old_dates = set(instance.completed_dates or [])
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        updated_instance = serializer.save()
        
        new_dates = set(updated_instance.completed_dates or [])
        today = date.today().isoformat()
        user = request.user
        old_level = user.level
        
        if today in new_dates and today not in old_dates:
            xp = updated_instance.xp_reward
            gold = xp // 2
            user.gold += gold
            user.add_experience(xp)

        elif today in old_dates and today not in new_dates:
            xp = updated_instance.xp_reward
            gold = xp // 2
            user.gold = max(0, user.gold - gold)
            user.add_experience(-xp)
        
        try:
            recalculate_quest_progress(user)
        except Exception as e:
            print(f"Ошибка пересчёта заданий: {e}")
        
        response_data = serializer.data
        response_data.update({
            'gold': user.gold,
            'experience': user.experience,
            'level': user.level,
            'is_completed_today': today in new_dates,
            'level_up': {
                'old_level': old_level,
                'new_level': user.level,
                'gold_reward': (user.level - old_level) * 10 if user.level > old_level else 0,
            }
        })
        
        return Response(response_data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        user = request.user
        today = date.today().isoformat()
        
        completed_dates = instance.completed_dates or []
        is_completed_today = today in completed_dates
        
        if is_completed_today:
            xp = instance.xp_reward
            gold = xp // 2
            user.gold = max(0, user.gold - gold)
            user.add_experience(-xp)
            user.save()
            completed_dates.remove(today)
            instance.completed_dates = completed_dates
            instance.save()

        instance.is_active = False
        instance.save()
        
        if is_completed_today:
            try:
                recalculate_quest_progress(user)
            except Exception as e:
                print(f"Ошибка пересчёта заданий: {e}")
        
        return Response(
            {
                'message': 'Привычка удалена',
                'xp_removed': xp if is_completed_today else 0,
                'gold_removed': gold if is_completed_today else 0,
            },
            status=200
        )