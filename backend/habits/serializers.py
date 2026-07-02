from rest_framework import serializers
from .models import Habit
from shop.models import Skin

class HabitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Habit
        fields = ('id', 'name', 'description', 'created_at', 'completed_dates', 'xp_reward', 'is_active', 'is_completed_today')
        read_only_fields = ('id', 'created_at', 'user', 'is_completed_today')
        
    def get_is_completed_today(self, obj):
        """Проверяет, выполнена ли привычка сегодня"""
        from datetime import date
        today = date.today().isoformat()
        return today in (obj.completed_dates or [])
        
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

