"""
Serializadores del módulo de productos.

Toda validación de datos de entrada va aquí, nunca en las vistas,
siguiendo la regla del proyecto.
"""
from rest_framework import serializers

from .models import Product, ProductImage


class ProductImageSerializer(serializers.ModelSerializer):
    """Serializador para las imágenes asociadas a un producto."""

    url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ['id', 'url', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']

    def get_url(self, obj):
        """Construye la URL absoluta de la imagen."""
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None


class ProductSerializer(serializers.ModelSerializer):
    """
    Serializador principal de productos.

    Incluye validaciones de campos obligatorios y datos del propietario
    como campos de solo lectura.
    """

    images = ProductImageSerializer(many=True, read_only=True)
    owner_name = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'title', 'description', 'category',
            'estimated_value', 'owner', 'owner_name',
            'images', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']

    def get_owner_name(self, obj):
        """Retorna el nombre completo del propietario o su email como fallback."""
        return obj.owner.get_full_name() or obj.owner.email

    def validate_title(self, value):
        """Valida que el título no esté vacío ni sea solo espacios."""
        if not value.strip():
            raise serializers.ValidationError("El título no puede estar vacío.")
        return value.strip()

    def validate_description(self, value):
        """Valida que la descripción no esté vacía ni sea solo espacios."""
        if not value.strip():
            raise serializers.ValidationError("La descripción no puede estar vacía.")
        return value.strip()

    def validate_estimated_value(self, value):
        """Valida que el valor estimado sea positivo si se proporciona."""
        if value is not None and value < 0:
            raise serializers.ValidationError("El valor estimado no puede ser negativo.")
        return value
