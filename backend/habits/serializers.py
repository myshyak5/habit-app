from rest_framework import serializers
from .models import Habit
from shop.models import Skin
from datetime import date

class HabitSerializer(serializers.ModelSerializer):
    is_completed_today = serializers.SerializerMethodField()
    gold_reward = serializers.SerializerMethodField()
    
    class Meta:
        model = Habit
        fields = (
            'id', 'name', 'description', 'created_at', 
            'completed_dates', 'xp_reward', 'is_active', 
            'is_completed_today', 'gold_reward'
        )
        read_only_fields = ('id', 'created_at', 'user', 'is_completed_today', 'gold_reward')
        
    def get_is_completed_today(self, obj):
        """Проверяет, выполнена ли привычка сегодня"""
        today = date.today().isoformat()
        return today in (obj.completed_dates or [])
    
    def get_gold_reward(self, obj):
        """Возвращает награду золотом (половина от XP)"""
        return obj.xp_reward // 2
        
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)