# backend/daily_quests/views.py

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import DailyQuest
from .serializers import DailyQuestSerializer
from datetime import date


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
        # Если заданий на сегодня нет — возвращаем пустой прогресс
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


