"""
Vistas del módulo de productos.

Implementa el CRUD completo de productos usando ViewSets de DRF.
Los permisos garantizan que solo el propietario pueda modificar o eliminar.
"""
import logging

from rest_framework import viewsets, filters, status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from apps.security.permissions import IsOwnerOrReadOnly
from .models import Product, ProductImage
from .serializers import ProductSerializer

logger = logging.getLogger(__name__)


class ProductPagination(PageNumberPagination):
    """Paginación para productos con tamaño de 10 por página."""
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


class ProductViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar productos del marketplace.

    Endpoints generados automáticamente:
    - GET    /products/       → listado público con búsqueda y filtros
    - POST   /products/       → crear producto (auth requerida)
    - GET    /products/{id}/  → detalle público
    - PUT    /products/{id}/  → editar (solo el dueño)
    - DELETE /products/{id}/  → eliminar (solo el dueño, retorna 204)
    """

    queryset = Product.objects.select_related('owner').prefetch_related('images').all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    pagination_class = ProductPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'title', 'estimated_value']
    ordering = ['-created_at']

    def get_queryset(self):
        """Filtra el queryset por categoría si se proporciona como query param."""
        queryset = super().get_queryset()
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        return queryset

    def perform_create(self, serializer):
        """Asigna el usuario autenticado como propietario y procesa las imágenes."""
        product = serializer.save(owner=self.request.user)
        self._save_images(product, self.request.FILES.getlist('images'))
        logger.info("Producto creado: '%s' por %s", product.title, self.request.user.email)

    def perform_update(self, serializer):
        """Actualiza el producto y registra la acción."""
        product = serializer.save()
        new_images = self.request.FILES.getlist('images')
        if new_images:
            self._save_images(product, new_images)
        logger.info("Producto actualizado: '%s' por %s", product.title, self.request.user.email)

    def perform_destroy(self, instance):
        """Elimina el producto y registra la acción."""
        logger.info("Producto eliminado: '%s' por %s", instance.title, self.request.user.email)
        instance.delete()

    def _save_images(self, product, image_files):
        """Crea registros de ProductImage a partir de los archivos subidos."""
        for image_file in image_files:
            ProductImage.objects.create(product=product, image=image_file)
