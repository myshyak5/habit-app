# backend/daily_quests/models.py

from django.db import models
from django.conf import settings

class DailyQuest(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    date = models.DateField(auto_now_add=True)
    
    quest_1_progress = models.IntegerField(default=0)  # Выполнить 3 привычки
    quest_2_progress = models.IntegerField(default=0)  # Выполнить сложную привычку
    quest_3_progress = models.IntegerField(default=0)  # Серия из 5 привычек
    quest_1_completed = models.BooleanField(default=False)
    quest_2_completed = models.BooleanField(default=False)
    quest_3_completed = models.BooleanField(default=False)
    quest_1_rewarded = models.BooleanField(default=False)
    quest_2_rewarded = models.BooleanField(default=False)
    quest_3_rewarded = models.BooleanField(default=False)
    all_completed = models.BooleanField(default=False)
    # rewarded = models.BooleanField(default=False)
    # processed_habits = models.JSONField(default=list, blank=True)
    
    class Meta:
        unique_together = ['user', 'date']
