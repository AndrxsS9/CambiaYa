"""Configuración de la app de productos."""
from django.apps import AppConfig


class ProductsConfig(AppConfig):
    """Configuración de la aplicación de productos del marketplace."""

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.products'
    verbose_name = 'Productos'
