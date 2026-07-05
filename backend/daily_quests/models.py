from django.db import models
from django.conf import settings
from datetime import date

class DailyQuest(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    date = models.DateField(default=date.today)
    
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
    all_rewarded = models.BooleanField(default=False)
    
    class Meta:
        unique_together = ['user', 'date']
