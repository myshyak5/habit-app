from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    experience = models.IntegerField(default=0, verbose_name='Опыт')
    level = models.IntegerField(default=1, verbose_name='Уровень')
    gold = models.IntegerField(default=0, verbose_name='Золото')
    health = models.IntegerField(default=100, verbose_name='Здоровье')
    avatar_skin = models.CharField(max_length=50, default='😊', verbose_name='Скин аватара')
    owned_skins = models.JSONField(default=list, verbose_name='Купленные скины')
    total_completed = models.IntegerField(default=0, verbose_name='Всего выполнено привычек')
    selected_skins = models.JSONField(default=list)

    def get_xp_for_level(self, level):
        """
        Возвращает точный СУММАРНЫЙ опыт для достижения уровня.
        Уровень 1: 0 XP
        Уровень 2: 100 XP
        Уровень 3: 325 XP (100 + 225)
        Уровень 4: 700 XP (100 + 225 + 375)
        Уровень 5: 1250 XP (100 + 225 + 375 + 550)
        """
        if level <= 1:
            return 0
            
        total_xp = 0
        current_step = 100 # Стартовый шаг между 1 и 2 уровнем
        
        for lvl in range(2, level + 1):
            total_xp += current_step
            # К следующему шагу прибавляем прогрессирующую сложность
            current_step += 100 + (lvl - 1) * 25
            
        return total_xp

    def get_xp_for_next_level(self):
        return self.get_xp_for_level(self.level + 1)

    def get_current_level_xp(self):
        return self.get_xp_for_level(self.level)

    def get_xp_progress(self):
        """Прогресс внутри текущего уровня (0% - 100%)"""
        base_xp = self.get_current_level_xp()
        next_xp = self.get_xp_for_next_level()
        
        total_needed = next_xp - base_xp
        earned = self.experience - base_xp
        
        if total_needed <= 0:
            return 100.0
            
        progress = (earned / total_needed) * 100
        return round(min(100.0, max(0.0, progress)), 1)

    def calculate_level_from_xp(self, xp):
        """Расчёт уровня по количеству XP (понятный перебор сверху вниз)"""
        if xp <= 0:
            return 1
            
        # Идем со 2-го уровня вверх, пока текущего опыта хватает
        lvl = 1
        while self.get_xp_for_level(lvl + 1) <= xp:
            lvl += 1
            # Ограничитель, чтобы цикл не стал бесконечным в непредвиденной ситуации
            if lvl >= 1000:
                break
        return lvl

    def add_experience(self, xp_amount):
        """Добавление опыта с пересчётом уровня"""
        old_level = self.level
        self.experience = max(0, self.experience + xp_amount)
        self.level = self.calculate_level_from_xp(self.experience)
        
        if self.level > old_level:
            self.gold += (self.level - old_level) * 10
        elif self.level < old_level:
            self.gold = max(0, self.gold - (old_level - self.level) * 10)
            
        self.save()

    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'