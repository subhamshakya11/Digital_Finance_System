from django.urls import path
from . import views

urlpatterns = [
    path('chat/', views.chat, name='chat'),
    path('history/', views.chat_history, name='chat-history'),
    path('clear/', views.clear_history, name='clear-history'),
]