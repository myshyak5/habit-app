from django.contrib import admin
from django.urls import path, include
from users.views import RegisterView, LoginView, UserProfileView, UpdateAvatarView
from rest_framework.routers import DefaultRouter
from habits.views import HabitViewSet, SkinViewSet

# Создаём роутер для ViewSet'ов
router = DefaultRouter()
router.register(r'habits', HabitViewSet, basename='habit')
router.register(r'skins', SkinViewSet, basename='skin')


urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Авторизация
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/login/', LoginView.as_view(), name='login'),
    
    path('api/user/', UserProfileView.as_view(), name='user-profile'),
    path('api/user/update_avatar/', UpdateAvatarView.as_view(), name='update-avatar'),
    
    path('api/', include(router.urls)),
]