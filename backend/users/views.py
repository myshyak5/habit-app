from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer, UserSerializer

User = get_user_model()

# ✅ РЕГИСТРАЦИЯ
class RegisterView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user_id': user.id,
            'username': user.username,
            'level': user.level,
            'experience': user.experience,
            'gold': user.gold,
        }, status=status.HTTP_201_CREATED)

# ✅ ЛОГИН
class LoginView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        user = authenticate(username=username, password=password)
        if not user:
            return Response({'error': 'Неверные учетные данные'}, status=status.HTTP_401_UNAUTHORIZED)
        
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user_id': user.id,
            'username': user.username,
            'level': user.level,
            'experience': user.experience,
            'gold': user.gold,
            'avatar_skin': user.avatar_skin,
        })

# ✅ ПРОФИЛЬ (GET)
class UserProfileView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

# ✅ ОБНОВЛЕНИЕ ПРОФИЛЯ (PUT/PATCH)
class UserProfileUpdateView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

# ✅ УДАЛЕНИЕ АККАУНТА
class DeleteUserView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        password = request.data.get('password')
        
        if not password:
            return Response(
                {'error': 'Введите пароль для подтверждения'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not user.check_password(password):
            return Response(
                {'error': 'Неверный пароль'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.delete()
        return Response(
            {'status': 'success', 'message': 'Аккаунт удалён'},
            status=status.HTTP_200_OK
        )

# ✅ ОБНОВЛЕНИЕ АВАТАРА
class UpdateAvatarView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        avatar_skin = request.data.get('avatar_skin')
        
        if not avatar_skin:
            return Response(
                {'error': 'Поле avatar_skin обязательно'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.avatar_skin = avatar_skin
        user.save()
        
        return Response({
            'status': 'success',
            'avatar_skin': user.avatar_skin
        }, status=status.HTTP_200_OK)