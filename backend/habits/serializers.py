from rest_framework import serializers
from .models import Habit, Skin

class HabitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Habit
        fields = ('id', 'name', 'description', 'created_at', 'completed_dates', 'xp_reward', 'is_active')
        read_only_fields = ('id', 'created_at', 'user')
        
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class SkinSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skin
        fields = ('id', 'name', 'emoji', 'price')   