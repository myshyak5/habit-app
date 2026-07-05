from django.urls import path
from . import views

urlpatterns = [
    path('', views.get_quest_progress, name='get_quest_progress'),
]