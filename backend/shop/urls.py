from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SkinViewSet

router = DefaultRouter()
router.register(r'skins', SkinViewSet, basename='skin')

urlpatterns = [
    path('', include(router.urls)),
]