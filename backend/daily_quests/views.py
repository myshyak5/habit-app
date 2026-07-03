# backend/daily_quests/views.py

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from datetime import date
from .models import DailyQuest
from .serializers import DailyQuestSerializer
from django.apps import apps


# =============================================
# 🔥 ОБНОВЛЕНИЕ НАГРАД ЗА ЗАДАНИЯ
# =============================================

def update_quest_rewards(user, quest):
    """Обновляет награды за задания (начисляет или отзывает)"""
    quests = [
        {'id': 1, 'completed': quest.quest_1_completed, 'rewarded': quest.quest_1_rewarded, 
         'gold': 10, 'xp': 20, 'reward_field': 'quest_1_rewarded'},
        {'id': 2, 'completed': quest.quest_2_completed, 'rewarded': quest.quest_2_rewarded,
         'gold': 15, 'xp': 30, 'reward_field': 'quest_2_rewarded'},
        {'id': 3, 'completed': quest.quest_3_completed, 'rewarded': quest.quest_3_rewarded,
         'gold': 20, 'xp': 40, 'reward_field': 'quest_3_rewarded'},
    ]
    
    for q in quests:
        if q['completed'] and not q['rewarded']:
            user.gold += q['gold']
            user.add_experience(q['xp'])
            setattr(quest, q['reward_field'], True)
        elif not q['completed'] and q['rewarded']:
            user.gold = max(0, user.gold - q['gold'])
            user.add_experience(-q['xp'])
            setattr(quest, q['reward_field'], False)
    
    user.save()
    quest.save()


# =============================================
# 🔄 ПОЛНЫЙ ПЕРЕСЧЁТ ПРОГРЕССА
# =============================================

def recalculate_quest_progress(user):
    """Полный пересчёт прогресса квестов на основе выполненных привычек"""
    Habit = apps.get_model('habits', 'Habit')
    
    today = date.today()
    today_str = today.isoformat()
    
    quest, created = DailyQuest.objects.get_or_create(user=user, date=today)
    
    habits = Habit.objects.filter(user=user, is_active=True)
    completed_habits = [h for h in habits if today_str in (h.completed_dates or [])]
    
    quest.quest_1_progress = len(completed_habits)
    quest.quest_2_progress = sum(1 for h in completed_habits if h.xp_reward >= 40)
    quest.quest_3_progress = len(completed_habits)
    
    quest.quest_1_completed = quest.quest_1_progress >= 3
    quest.quest_2_completed = quest.quest_2_progress >= 1
    quest.quest_3_completed = quest.quest_3_progress >= 5
    
    quest.all_completed = (
        quest.quest_1_completed and 
        quest.quest_2_completed and 
        quest.quest_3_completed
    )
    
    update_quest_rewards(user, quest)
    quest.save()
    return quest


# =============================================
# 📋 API
# =============================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_quest_progress(request):
    """Получить прогресс ежедневных заданий на сегодня"""
    user = request.user
    today = date.today()
    
    try:
        quest = DailyQuest.objects.get(user=user, date=today)
        serializer = DailyQuestSerializer(quest)
        return Response(serializer.data)
    except DailyQuest.DoesNotExist:
        return Response({
            'quest_1_progress': 0,
            'quest_2_progress': 0,
            'quest_3_progress': 0,
            'quest_1_completed': False,
            'quest_2_completed': False,
            'quest_3_completed': False,
            'quest_1_rewarded': False,
            'quest_2_rewarded': False,
            'quest_3_rewarded': False,
            'all_completed': False,
        })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_quest_progress(request):
    """
    Обновить прогресс ежедневных заданий.
    Использует полный пересчёт на основе выполненных привычек.
    """
    user = request.user
    
    # Полный пересчёт
    quest = recalculate_quest_progress(user)
    
    return Response({
        'quest_1_progress': quest.quest_1_progress,
        'quest_2_progress': quest.quest_2_progress,
        'quest_3_progress': quest.quest_3_progress,
        'quest_1_completed': quest.quest_1_completed,
        'quest_2_completed': quest.quest_2_completed,
        'quest_3_completed': quest.quest_3_completed,
        'quest_1_rewarded': quest.quest_1_rewarded,
        'quest_2_rewarded': quest.quest_2_rewarded,
        'quest_3_rewarded': quest.quest_3_rewarded,
        'all_completed': quest.all_completed,
    })