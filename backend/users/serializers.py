from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('username', 'password', 'password2', 'email')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Пароли не совпадают"})
        return attrs

    def create(self, validated_data):
        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data.get('email', '')
        )
        user.set_password(validated_data['password'])
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    xp_for_next_level = serializers.SerializerMethodField()
    xp_remaining = serializers.SerializerMethodField()
    xp_progress = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 
            'experience', 'level', 'gold', 'avatar_skin', 'owned_skins',
            'total_completed', 'xp_for_next_level', 'xp_remaining', 'xp_progress'
        )
        read_only_fields = (
            'id', 'experience', 'level', 'gold', 
            'xp_for_next_level', 'xp_remaining', 'xp_progress'
        )
    
    def get_xp_for_next_level(self, obj):
        current_level_base_xp = obj.get_current_level_xp()
        next_level_total_xp = obj.get_xp_for_next_level()
        return next_level_total_xp - current_level_base_xp
    
    def get_xp_remaining(self, obj):
        next_level_xp = obj.get_xp_for_next_level()
        return max(0, next_level_xp - obj.experience)
    
    def get_xp_progress(self, obj):
        return obj.get_xp_progress()