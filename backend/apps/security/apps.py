"""
Configuración de la app Security.
Ítem 13 — Seguridad y privacidad (RNF03, RNF09).
"""
from django.apps import AppConfig


class SecurityConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.security"
    verbose_name = "Seguridad y Privacidad"
