from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    # Игровые поля
    experience = models.IntegerField(default=0, verbose_name='Опыт')
    level = models.IntegerField(default=1, verbose_name='Уровень')
    gold = models.IntegerField(default=0, verbose_name='Золото')
    health = models.IntegerField(default=100, verbose_name='Здоровье')
    avatar_skin = models.CharField(max_length=50, default='default', verbose_name='Скин аватара')
    
    # Дата регистрации (уже есть в AbstractUser)
    
    def __str__(self):
        return self.username
    
    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'