from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    # Игровые поля
    experience = models.IntegerField(default=0, verbose_name='Опыт')
    level = models.IntegerField(default=1, verbose_name='Уровень')
    gold = models.IntegerField(default=0, verbose_name='Золото')
    health = models.IntegerField(default=100, verbose_name='Здоровье')
    avatar_skin = models.CharField(max_length=50, default='😊', verbose_name='Скин аватара')
    owned_skins = models.JSONField(default=list, verbose_name='Купленные скины')
    # Дата регистрации (уже есть в AbstractUser)
    
    def __str__(self):
        return self.username
    
    def add_experience(self, xp_amount):
        """Добавить опыт и обновить уровень"""
        old_level = self.level
        self.experience += xp_amount
    
        if self.experience < 0:
            self.experience = 0
    
        self.level = max(1, self.experience // 100 + 1)
        
        if self.level > old_level:
            self.gold += 10
            
        self.save()
    
    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'