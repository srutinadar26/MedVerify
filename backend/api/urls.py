from django.urls import path
from .views import ClaimListCreateView, RegisterView
from chatbot.views import (
    verify_text,
    verify_url,
    verify_image,
    history,
    history_detail,
    analytics,
    health,
    chat,
)


urlpatterns = [
    # Auth & user
    path('register', RegisterView.as_view(), name='register_noslash'),
    path('register/', RegisterView.as_view(), name='register'),
    path('claims', ClaimListCreateView.as_view(), name='claims_noslash'),
    path('claims/', ClaimListCreateView.as_view(), name='claims'),

    # Verification pipeline (supports both trailing slash and no-trailing slash)
    path('verify/text', verify_text, name='verify_text_noslash'),
    path('verify/text/', verify_text, name='verify_text'),
    path('verify/url', verify_url, name='verify_url_noslash'),
    path('verify/url/', verify_url, name='verify_url'),
    path('verify/image', verify_image, name='verify_image_noslash'),
    path('verify/image/', verify_image, name='verify_image'),

    # History
    path('history', history, name='history_noslash'),
    path('history/', history, name='history'),
    path('history/<int:pk>', history_detail, name='history_detail_noslash'),
    path('history/<int:pk>/', history_detail, name='history_detail'),

    # Analytics & health
    path('analytics', analytics, name='analytics_noslash'),
    path('analytics/', analytics, name='analytics'),
    path('health', health, name='health_noslash'),
    path('health/', health, name='health'),

    # Chatbot
    path('chat', chat, name='chat_noslash'),
    path('chat/', chat, name='chat'),
]