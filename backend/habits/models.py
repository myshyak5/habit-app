from django.db import models
from django.conf import settings

class Habit(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='habits',
        verbose_name='Пользователь'
    )
    name = models.CharField(max_length=200, verbose_name='Название')
    description = models.TextField(blank=True, verbose_name='Описание')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    completed_dates = models.JSONField(default=list, verbose_name='Даты выполнения')
    xp_reward = models.IntegerField(default=10, verbose_name='Награда за выполнение (XP)')
    is_active = models.BooleanField(default=True, verbose_name='Активна')
    
    def __str__(self):
        return f"{self.user.username} - {self.name}"
    
    
    def is_completed_today(self):
        from datetime import date
        today = date.today().isoformat()
        return today in self.completed_dates
    
    def toggle_today(self):
        from datetime import date
        today = date.today().isoformat()
        
        if today in self.completed_dates:
            self.completed_dates.remove(today)
            self.user.add_experience(-self.xp_reward)
            return False 
        else:
            self.completed_dates.append(today)
            self.user.add_experience(self.xp_reward)
            return True
    
    class Meta:
        verbose_name = 'Привычка'
        verbose_name_plural = 'Привычки'
        ordering = ['-created_at']
        
