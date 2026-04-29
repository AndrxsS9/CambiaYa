"""
Router de la API v1 — agrega todos los módulos bajo /api/v1/.
"""
from django.urls import path, include

urlpatterns = [
    path("auth/", include("apps.users.urls")),
    path("users/", include("apps.users.profile_urls")),
    path("products/", include("apps.products.urls")),
    path("security/", include("apps.security.urls")),  # Ítem 13
]
