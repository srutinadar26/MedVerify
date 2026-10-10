from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from chatbot.views import health


def root_view(request):
    """Root endpoint to verify deployment status and prevent 404 errors."""
    return JsonResponse({
        "status": "healthy",
        "service": "MedVerify AI Backend API",
        "version": "2.0.0",
        "message": "Welcome to MedVerify AI API. Visit /api/health/ for detailed service health.",
        "endpoints": {
            "health": "/api/health/",
            "verify_text": "/api/verify/text/",
            "verify_url": "/api/verify/url/",
            "verify_image": "/api/verify/image/",
            "history": "/api/history/",
            "analytics": "/api/analytics/",
            "chat": "/api/chat/",
        }
    })


urlpatterns = [
    # Root & Health check
    path('', root_view, name='root'),
    path('health', health, name='root_health_noslash'),
    path('health/', health, name='root_health'),

    # Django admin
    path('admin/', admin.site.urls),

    # Our API
    path('api/', include('api.urls')),

    # JWT login
    path(
        'api/login/',
        TokenObtainPairView.as_view(),
        name='token_obtain_pair'
    ),

    # Get a new access token
    path(
        'api/token/refresh/',
        TokenRefreshView.as_view(),
        name='token_refresh'
    ),
    path('api/chat/', include('chatbot.urls')),
]