"""
Configuración de URLs del proyecto CambiaYa.

Enruta todas las peticiones HTTP a los módulos correspondientes
bajo el prefijo /api/v1/ usando el api_router centralizado.
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include('config.api_router')),
    path('api/v1/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
