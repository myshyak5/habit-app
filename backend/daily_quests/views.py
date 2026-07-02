# backend/daily_quests/views.py

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from .models import DailyQuest
from .serializers import DailyQuestSerializer



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_quest_progress(request):
    """Получить прогресс ежедневных заданий на сегодня"""
    user = request.user
    today = timezone.now().date()
    
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
            'all_completed': False,
            'rewarded': False,
        })


# =============================================
# 🔥 ДОБАВИТЬ ЭТУ ФУНКЦИЮ
# =============================================

# backend/daily_quests/views.py

# backend/daily_quests/views.py


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_quest_progress(request):
    user = request.user
    today = timezone.now().date()
    habit_xp = request.data.get('habit_xp', 0)
    is_completed = request.data.get('is_completed', True)
    
    quest, created = DailyQuest.objects.get_or_create(user=user, date=today)
    
    # ---- 1. ОБНОВЛЯЕМ ПРОГРЕСС ----
    if is_completed:
        quest.quest_1_progress += 1
        if habit_xp >= 40:
            quest.quest_2_progress += 1
    else:
        quest.quest_1_progress = max(0, quest.quest_1_progress - 1)
        if habit_xp >= 40:
            quest.quest_2_progress = max(0, quest.quest_2_progress - 1)
    
    quest.quest_3_progress = quest.quest_1_progress
    
    # ---- 2. ПРОВЕРЯЕМ ВЫПОЛНЕНИЕ ----
    quest.quest_1_completed = quest.quest_1_progress >= 3
    quest.quest_2_completed = quest.quest_2_progress >= 1
    quest.quest_3_completed = quest.quest_3_progress >= 5
    
    quest.all_completed = (
        quest.quest_1_completed and 
        quest.quest_2_completed and 
        quest.quest_3_completed
    )
    
    # ❌ УДАЛИТЬ ВСЮ ЛОГИКУ С НАГРАДОЙ
    # if quest.all_completed and not quest.rewarded:
    #     user.gold += 45
    #     user.experience += 90
    #     user.save()
    #     quest.rewarded = True
    # elif not quest.all_completed and quest.rewarded:
    #     user.gold = max(0, user.gold - 45)
    #     user.experience = max(0, user.experience - 90)
    #     user.save()
    #     quest.rewarded = False
    
    quest.save()
    
    return Response({
        'quest_1_progress': quest.quest_1_progress,
        'quest_2_progress': quest.quest_2_progress,
        'quest_3_progress': quest.quest_3_progress,
        'quest_1_completed': quest.quest_1_completed,
        'quest_2_completed': quest.quest_2_completed,
        'quest_3_completed': quest.quest_3_completed,
        'all_completed': quest.all_completed,
        # ❌ УДАЛИТЬ 'rewarded'
        # 'rewarded': quest.rewarded,
    })
def get_quest_data(quest):
    return {
        'quest_1_progress': quest.quest_1_progress,
        'quest_2_progress': quest.quest_2_progress,
        'quest_3_progress': quest.quest_3_progress,
        'quest_1_completed': quest.quest_1_completed,
        'quest_2_completed': quest.quest_2_completed,
        'quest_3_completed': quest.quest_3_completed,
        'all_completed': quest.all_completed,
        'rewarded': quest.rewarded,
    }