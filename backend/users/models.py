from django.db import models
from django.contrib.auth.models import AbstractUser
import math

class User(AbstractUser):
    experience = models.IntegerField(default=0, verbose_name='Опыт')
    level = models.IntegerField(default=1, verbose_name='Уровень')
    gold = models.IntegerField(default=0, verbose_name='Золото')
    avatar_skin = models.CharField(max_length=50, default='😊', verbose_name='Скин аватара')
    owned_skins = models.JSONField(default=list, verbose_name='Купленные скины')

    def get_xp_for_level(self, level):
        if level <= 1:
            return 0
        total_xp = 0
        current_step = 100
        for lvl in range(2, level + 1):
            total_xp += current_step
            current_step += 100 + (lvl - 1) * 25
        return total_xp

    def get_xp_for_next_level(self):
        return self.get_xp_for_level(self.level + 1)

    def get_current_level_xp(self):
        return self.get_xp_for_level(self.level)

    def get_xp_progress(self):
        base_xp = self.get_current_level_xp()
        next_xp = self.get_xp_for_next_level()
        total_needed = next_xp - base_xp
        earned = self.experience - base_xp
        if total_needed <= 0:
            return 100.0
        progress = (earned / total_needed) * 100
        return round(min(100.0, max(0.0, progress)), 1)

    def calculate_level_from_xp(self, xp):
        if xp <= 0:
            return 1
        level = 1
        while self.get_xp_for_level(level + 1) <= xp:
            level += 1
            if level >= 1000:
                break
        return level

    def add_experience(self, xp_amount):
        old_level = self.level
        self.experience = max(0, self.experience + xp_amount)
        self.level = self.calculate_level_from_xp(self.experience)
        levels_gained = self.level - old_level
        if levels_gained > 0:
            self.gold += levels_gained * 10
        elif levels_gained < 0:
            self.gold = max(0, self.gold + levels_gained * 10)
        self.save(update_fields=['experience', 'level', 'gold'])
        return {
            'old_level': old_level,
            'new_level': self.level,
            'levels_gained': levels_gained,
            'gold_reward': levels_gained * 10 if levels_gained > 0 else 0,
            'xp_reward': xp_amount
        }

    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'