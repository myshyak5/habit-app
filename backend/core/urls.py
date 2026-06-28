from django.contrib import admin
from django.urls import path, include
from users.views import RegisterView, LoginView
from rest_framework.routers import DefaultRouter
from habits.views import HabitViewSet

# Создаём роутер для ViewSet'ов
router = DefaultRouter()
router.register(r'habits', HabitViewSet, basename='habit')

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Авторизация
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/login/', LoginView.as_view(), name='login'),
    
    # API для привычек
    path('api/', include(router.urls)),
]