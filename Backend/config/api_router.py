"""
Router de la API v1 — registra todos los módulos bajo /api/v1/.

Módulos disponibles:
  - auth/        → Registro, login, perfil básico
  - users/       → Perfil extendido
  - products/    → CRUD de productos
  - exchanges/   → Intercambios entre usuarios
  - chats/       → Mensajería interna
  - security/    → Política de privacidad y consentimiento
"""
from django.urls import path, include

urlpatterns = [
    path("auth/", include("apps.users.urls")),
    path("users/", include("apps.users.profile_urls")),
    path("products/", include("apps.products.urls")),
    path("exchanges/", include("apps.exchanges.urls")),
    path("chats/", include("apps.chats.urls")),
    path("security/", include("apps.security.urls")),
]
