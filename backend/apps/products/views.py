"""
Vistas de la app products.
GET (lista) es público; POST, PUT, DELETE requieren autenticación y propiedad.
"""
import logging
from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from .models import Product
from .serializers import ProductSerializer
from .permissions import IsOwnerOrReadOnly

logger = logging.getLogger(__name__)


class ProductViewSet(viewsets.ModelViewSet):
    """
    ViewSet completo para productos.
    - GET /api/v1/products/        → Listado público, con filtros de categoría y dueño.
    - POST /api/v1/products/       → Crear producto (debe estar autenticado).
    - PUT/PATCH /api/v1/products/{id}/ → Solo el dueño.
    - DELETE /api/v1/products/{id}/    → Solo el dueño.
    """
    queryset = Product.objects.filter(is_available=True).select_related("owner")
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "description", "category"]
    ordering_fields = ["created_at", "title"]

    def get_queryset(self):
        """Aplica filtros opcionales por categoría y por dueño (owner)."""
        queryset = super().get_queryset()
        category = self.request.query_params.get("category")
        owner_id = self.request.query_params.get("owner")

        if category:
            queryset = queryset.filter(category=category)
        if owner_id:
            queryset = queryset.filter(owner__id=owner_id)

        return queryset

    def perform_create(self, serializer):
        """Asigna automáticamente el dueño al usuario autenticado."""
        product = serializer.save(owner=self.request.user)
        logger.info(
            "Producto '%s' creado por %s", product.title, self.request.user.email
        )
