from django.urls import path
from .views import ClaimListCreateView, RegisterView


urlpatterns = [
    path('claims/', ClaimListCreateView.as_view(), name='claims'),
    path('register/', RegisterView.as_view(), name='register'),
]