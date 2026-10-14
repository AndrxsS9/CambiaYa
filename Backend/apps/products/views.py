import logging

from rest_framework import viewsets, filters, status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response

from apps.security.permissions import IsOwnerOrReadOnly
from .models import Product, ProductImage
from .serializers import ProductSerializer

logger = logging.getLogger(__name__)


class ProductViewSet(viewsets.ModelViewSet):

    queryset = Product.objects.select_related('owner').prefetch_related('images').all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'title', 'estimated_value']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        return queryset

    def perform_create(self, serializer):
        product = serializer.save(owner=self.request.user)
        self._save_images(product, self.request.FILES.getlist('images'))
        logger.info("Producto creado: '%s' por %s", product.title, self.request.user.email)

    def perform_update(self, serializer):
        product = serializer.save()
        new_images = self.request.FILES.getlist('images')
        if new_images:
            self._save_images(product, new_images)
        logger.info("Producto actualizado: '%s' por %s", product.title, self.request.user.email)

    def perform_destroy(self, instance):
        logger.info("Producto eliminado: '%s' por %s", instance.title, self.request.user.email)
        instance.delete()

    def _save_images(self, product, image_files):
        for image_file in image_files:
            try:
                ProductImage.objects.create(product=product, image=image_file)
                logger.info("Imagen guardada en Cloudinary: %s", product.images.last().image.url)
            except Exception as e:
                logger.error("Error al guardar imagen en Cloudinary: %s", str(e))
