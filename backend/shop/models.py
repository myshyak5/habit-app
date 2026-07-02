from django.db import models

class Skin(models.Model):
    emoji = models.CharField(max_length=10, verbose_name='Эмодзи')
    name = models.CharField(max_length=50, verbose_name='Название')
    price = models.IntegerField(verbose_name='Цена')
    
    def __str__(self):
        return f"{self.emoji} {self.name} ({self.price}💰)"