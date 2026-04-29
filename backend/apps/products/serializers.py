"""
Serializers de la app products.
Valida tamaño de imagen (≤ 10MB) antes de enviar a Cloudinary.
"""
import logging
from rest_framework import serializers
from .models import Product, ProductImage

logger = logging.getLogger(__name__)

# Límite de tamaño de imagen según business_rules.md
MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


class ProductImageSerializer(serializers.ModelSerializer):
    """Serializer para imágenes individuales de un producto."""
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ["id", "image_url", "image"]
        extra_kwargs = {
            "image": {"write_only": True},
        }

    def get_image_url(self, obj):
        """Retorna la URL pública de Cloudinary."""
        if obj.image:
            return obj.image.url
        return None

    def validate_image(self, value):
        """Rechaza imágenes mayores a 10MB antes de subirlas a Cloudinary."""
        if hasattr(value, "size") and value.size > MAX_IMAGE_SIZE_BYTES:
            raise serializers.ValidationError(
                "La imagen no puede superar los 10MB."
            )
        return value


class ProductSerializer(serializers.ModelSerializer):
    """
    Serializer principal de productos.
    Incluye imágenes anidadas y expone el email del dueño (solo lectura).
    """
    images = ProductImageSerializer(many=True, read_only=True)
    owner_email = serializers.EmailField(source="owner.email", read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "owner_email",
            "title",
            "description",
            "category",
            "estimated_value",
            "is_available",
            "images",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "owner_email", "created_at", "updated_at"]
