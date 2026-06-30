from django.contrib import admin
from .models import Habit, Skin

@admin.register(Habit)
class HabitAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'xp_reward', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'user__username')

@admin.register(Skin)
class SkinAdmin(admin.ModelAdmin):
    list_display = ('name', 'emoji', 'price')
    list_editable = ('price',)  # Можно менять цену прямо в списке