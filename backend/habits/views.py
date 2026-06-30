from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import Habit
from .serializers import HabitSerializer
from datetime import date


class HabitViewSet(viewsets.ModelViewSet):
    serializer_class = HabitSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post', 'put', 'patch', 'delete']

    def get_queryset(self):
        return Habit.objects.filter(user=self.request.user, is_active=True)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def update(self, request, *args, **kwargs):
        """Обновление привычки (включая отметку выполнения)"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Сохраняем старые даты ДО обновления
        old_dates = set(instance.completed_dates or [])
        
        # Обновляем привычку через сериализатор
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        # Сохраняем и получаем обновлённый объект
        updated_instance = serializer.save()
        
        # Получаем новые даты ПОСЛЕ обновления
        new_dates = set(updated_instance.completed_dates or [])
        today = date.today().isoformat()
        user = request.user
        
        # ---- ЛОГИКА НАЧИСЛЕНИЯ ОПЫТА ----
        # Если привычка ТОЛЬКО ЧТО выполнена (есть сегодня, не было раньше)
        if today in new_dates and today not in old_dates:
            user.add_experience(updated_instance.xp_reward)
           
        # Если привычка ТОЛЬКО ЧТО отменена (была сегодня, теперь нет)
        elif today in old_dates and today not in new_dates:
            user.add_experience(-updated_instance.xp_reward)
        
        return Response(serializer.data)

    def perform_update(self, serializer):
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        """Удаление привычки (мягкое удаление)"""
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)