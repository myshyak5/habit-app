# backend/daily_quests/serializers.py

from rest_framework import serializers
from .models import DailyQuest

class DailyQuestSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyQuest
        fields = [
            'quest_1_progress', 'quest_2_progress', 'quest_3_progress',
            'quest_1_completed', 'quest_2_completed', 'quest_3_completed',
            'all_completed', 'rewarded'
        ]