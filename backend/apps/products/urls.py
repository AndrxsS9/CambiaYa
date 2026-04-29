"""
URLs de productos → /api/v1/products/
Usa DefaultRouter para generar automáticamente las rutas del ViewSet.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet

router = DefaultRouter()
router.register(r"", ProductViewSet, basename="products")

urlpatterns = [
    path("", include(router.urls)),
]
