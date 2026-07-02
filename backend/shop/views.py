from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Skin
from .serializers import SkinSerializer

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

        # Безопасная проверка списков
        owned_skins_list = user.owned_skins if isinstance(user.owned_skins, list) else []

        # Проверяем, не куплен ли уже
        if skin.id in owned_skins_list:
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
        
        # Явное переприсваивание списка, чтобы Django зафиксировал изменения в JSONField
        user.owned_skins = owned_skins_list + [skin.id]
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

        owned_skins_list = user.owned_skins if isinstance(user.owned_skins, list) else []

        # Проверяем, есть ли скин у пользователя
        if skin.id not in owned_skins_list:
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

