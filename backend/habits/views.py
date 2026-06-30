from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Habit, Skin
from .serializers import HabitSerializer, SkinSerializer
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
            xp = updated_instance.xp_reward
            gold = xp // 2  # Половина опыта в золоте (целочисленное деление)
            user.add_experience(xp)
            user.gold += gold
        
            user.save()

        # Если привычка ТОЛЬКО ЧТО отменена (была сегодня, теперь нет)
        elif today in old_dates and today not in new_dates:
            xp = updated_instance.xp_reward
            gold = xp // 2  # Половина опыта в золоте
            user.add_experience(-xp)
            user.gold = max(0, user.gold - gold)
        
            user.save()
        return Response(serializer.data)

    def perform_update(self, serializer):
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        """Удаление привычки (мягкое удаление)"""
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    
    
class SkinViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet для работы со скинами"""
    serializer_class = SkinSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Skin.objects.all()

    @action(detail=True, methods=['post'], url_path='buy')
    def buy_skin(self, request, pk=None):
        """Покупка скина"""
        skin = self.get_object()
        user = request.user

        # Проверяем, не куплен ли уже
        if skin.id in (user.owned_skins or []):
            return Response(
                {'error': 'Этот скин уже куплен'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Проверяем, хватает ли золота
        if user.gold < skin.price:
            return Response(
                {'error': f'Недостаточно золота. Нужно {skin.price}, у вас {user.gold}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Списываем золото
        user.gold -= skin.price
        
        # Добавляем скин в список купленных
        if user.owned_skins is None:
            user.owned_skins = []
        user.owned_skins.append(skin.id)
        
        # Автоматически активируем скин (если пользователь хочет)
        # Но фронт сам вызовет activate, так что просто сохраняем
        user.save()

        return Response({
            'status': 'success',
            'message': f'Скин "{skin.name}" куплен!',
            'gold_left': user.gold,
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='activate')
    def activate_skin(self, request, pk=None):
        """Активация скина"""
        skin = self.get_object()
        user = request.user

        # Проверяем, есть ли скин у пользователя
        if skin.id not in (user.owned_skins or []):
            return Response(
                {'error': 'Этот скин не куплен'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Активируем скин (сохраняем эмодзи)
        user.avatar_skin = skin.emoji
        user.save()

        return Response({
            'status': 'success',
            'message': f'Скин "{skin.name}" активирован!',
            'avatar_skin': user.avatar_skin
        }, status=status.HTTP_200_OK)