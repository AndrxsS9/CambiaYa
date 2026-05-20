"""
URLs de autenticación → /api/v1/auth/
Incluye registro, login JWT y refresh de token.
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView

urlpatterns = [
    # POST /api/v1/auth/register/
    path("register/", RegisterView.as_view(), name="auth-register"),
    # POST /api/v1/auth/login/ → retorna {access, refresh}
    path("login/", TokenObtainPairView.as_view(), name="auth-login"),
    # POST /api/v1/auth/token/refresh/ → renueva el access token
    path("token/refresh/", TokenRefreshView.as_view(), name="auth-token-refresh"),
]
