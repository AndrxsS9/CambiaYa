"""
URLs de perfil → /api/v1/users/
"""
from django.urls import path
from .views import MeView

urlpatterns = [
    # GET/PUT /api/v1/users/me/
    path("me/", MeView.as_view(), name="users-me"),
]
