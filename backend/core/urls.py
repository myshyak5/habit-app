from django.contrib import admin
from django.urls import path, include
from users.views import RegisterView, LoginView, UserProfileView, UpdateAvatarView, UserProfileUpdateView, DeleteUserView
from rest_framework.routers import DefaultRouter
from habits.views import HabitViewSet
from daily_quests.views import get_quest_progress, update_quest_progress  # ← ДОБАВИТЬ update_quest_progress
from shop.views import SkinViewSet


# Создаём роутер для ViewSet'ов
router = DefaultRouter()
router.register(r'habits', HabitViewSet, basename='habit')
router.register(r'skins', SkinViewSet, basename='skin')


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    
    # Авторизация
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/login/', LoginView.as_view(), name='login'),
    path('api/user/', UserProfileView.as_view(), name='user-profile'),
    path('api/user/profile/', UserProfileView.as_view(), name='user-profile'),
    path('api/user/profile/update/', UserProfileUpdateView.as_view(), name='user-update'),
    path('api/user/delete/', DeleteUserView.as_view(), name='user-delete'),
    path('api/user/update-avatar/', UpdateAvatarView.as_view(), name='update-avatar'),
    
    # Ежедневные задания
    path('api/daily-quests/', get_quest_progress, name='daily-quests'),
    path('api/daily-quests/update/', update_quest_progress, name='daily-quests-update'),  # ← ДОБАВИТЬ
]