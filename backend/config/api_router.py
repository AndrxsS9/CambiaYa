"""
Router de la API v1 — agrega todos los módulos bajo /api/v1/.
"""
from django.urls import path, include

urlpatterns = [
    path("auth/", include("apps.users.urls")),
    path("users/", include("apps.users.profile_urls")),
    path("products/", include("apps.products.urls")),
    path("chats/", include("apps.chats.urls")),
    path("exchanges/", include("apps.exchanges.urls")),
]
