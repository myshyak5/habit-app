from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import Habit
from .serializers import HabitSerializer

class HabitViewSet(viewsets.ModelViewSet):
    serializer_class = HabitSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Возвращаем только привычки текущего пользователя
        return Habit.objects.filter(user=self.request.user, is_active=True)

    def perform_create(self, serializer):
        # При создании автоматически подставляем текущего пользователя
        serializer.save(user=self.request.user)

    def perform_destroy(self, instance):
        # Мягкое удаление (просто помечаем как неактивную)
        instance.is_active = False
        instance.save()