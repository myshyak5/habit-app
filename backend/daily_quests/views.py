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
    
    # 👇 БОНУС ЗА ВСЕ ЗАДАНИЯ
    all_completed = quest.quest_1_completed and quest.quest_2_completed and quest.quest_3_completed
    bonus_gold = 25
    bonus_xp = 50
    
    for q in quests:
        if q['completed'] and not q['rewarded']:
            user.gold += q['gold']
            user.add_experience(q['xp'])
            setattr(quest, q['reward_field'], True)
        elif not q['completed'] and q['rewarded']:
            user.gold = max(0, user.gold - q['gold'])
            user.add_experience(-q['xp'])
            setattr(quest, q['reward_field'], False)
    
    # 👇 НАЧИСЛЯЕМ БОНУС, ЕСЛИ ВСЕ ВЫПОЛНЕНЫ
    if all_completed and not quest.all_rewarded:
        user.gold += bonus_gold
        user.add_experience(bonus_xp)
        quest.all_rewarded = True
        print(f"🎉 Бонус за все задания: +{bonus_gold} 💵 +{bonus_xp} XP")
    elif not all_completed and quest.all_rewarded:
        user.gold = max(0, user.gold - bonus_gold)
        user.add_experience(-bonus_xp)
        quest.all_rewarded = False
        print(f"⏳ Бонус за все задания отозван")
    
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
    
    habits = Habit.objects.filter(user=user, is_active=True).only('id', 'completed_dates', 'xp_reward')
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
    
    # Базовое описание заданий
    quests_info = [
        {
            'id': 1,
            'name': '💪 Выполнить 3 привычки',
            'description': 'Отметь 3 любые привычки сегодня',
            'target': 3,
            'reward_gold': 10,
            'reward_xp': 20,
        },
        {
            'id': 2,
            'name': '📚 Выполнить сложную привычку',
            'description': 'Выполни привычку с наградой 40+ XP',
            'target': 1,
            'reward_gold': 15,
            'reward_xp': 30,
        },
        {
            'id': 3,
            'name': '🔥 Серия из 5 привычек',
            'description': 'Выполни 5 привычек подряд без пропусков',
            'target': 5,
            'reward_gold': 20,
            'reward_xp': 40,
        },
    ]
    
    try:
        quest = DailyQuest.objects.get(user=user, date=today)
        serializer = DailyQuestSerializer(quest)
        data = serializer.data
        
        # Добавляем прогресс к каждому заданию
        data['quests_info'] = []
        for q in quests_info:
            progress_key = f'quest_{q["id"]}_progress'
            completed_key = f'quest_{q["id"]}_completed'
            q_data = q.copy()
            q_data['progress'] = data.get(progress_key, 0)
            q_data['completed'] = data.get(completed_key, False)
            data['quests_info'].append(q_data)
        
        # Добавляем информацию о бонусе
        data['bonus'] = {
            'gold': 25,
            'xp': 50,
            'all_completed': quest.all_completed,
            'all_rewarded': quest.all_rewarded,
        }
        
        return Response(data)
        
    except DailyQuest.DoesNotExist:
        data = {
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
            'bonus': {
                'gold': 25,
                'xp': 50,
                'all_completed': False,
                'all_rewarded': False,
            }
        }
        data['quests_info'] = []
        for q in quests_info:
            q_data = q.copy()
            q_data['progress'] = 0
            q_data['completed'] = False
            data['quests_info'].append(q_data)
        
        return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_quest_progress(request):
    """
    Обновить прогресс ежедневных заданий.
    Использует полный пересчёт на основе выполненных привычек.
    """
    user = request.user
    
    quest = recalculate_quest_progress(user)
    
    quests_info = [
        {
            'id': 1,
            'name': '💪 Выполнить 3 привычки',
            'description': 'Отметь 3 любые привычки сегодня',
            'target': 3,
            'reward_gold': 10,
            'reward_xp': 20,
        },
        {
            'id': 2,
            'name': '📚 Выполнить сложную привычку',
            'description': 'Выполни привычку с наградой 40+ XP',
            'target': 1,
            'reward_gold': 15,
            'reward_xp': 30,
        },
        {
            'id': 3,
            'name': '🔥 Серия из 5 привычек',
            'description': 'Выполни 5 привычек подряд без пропусков',
            'target': 5,
            'reward_gold': 20,
            'reward_xp': 40,
        },
    ]
    
    response_data = {
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
        'bonus': {
            'gold': 25,
            'xp': 50,
            'all_completed': quest.all_completed,
            'all_rewarded': quest.all_rewarded,
        }
    }
    
    response_data['quests_info'] = []
    for q in quests_info:
        progress_key = f'quest_{q["id"]}_progress'
        completed_key = f'quest_{q["id"]}_completed'
        q_data = q.copy()
        q_data['progress'] = getattr(quest, progress_key, 0)
        q_data['completed'] = getattr(quest, completed_key, False)
        response_data['quests_info'].append(q_data)
    
    return Response(response_data)