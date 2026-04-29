"""
Modelos de la app products: Product y ProductImage.
El campo precio es opcional por defecto (lógica de trueque per business_rules.md).
"""
import logging
from django.db import models
from django.conf import settings
from cloudinary.models import CloudinaryField

logger = logging.getLogger(__name__)


class Product(models.Model):
    """
    Producto publicado para intercambio.
    El dueño es el único que puede editarlo o eliminarlo.
    """
    CATEGORY_CHOICES = [
        ("electronics", "Electrónica"),
        ("clothing", "Ropa y accesorios"),
        ("books", "Libros"),
        ("sports", "Deportes"),
        ("home", "Hogar"),
        ("other", "Otro"),
    ]

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="products",
        verbose_name="Propietario",
    )
    title = models.CharField(max_length=200, verbose_name="Título")
    description = models.TextField(verbose_name="Descripción")
    category = models.CharField(
        max_length=50,
        choices=CATEGORY_CHOICES,
        default="other",
        verbose_name="Categoría",
    )
    # El precio es opcional (flujo de trueque)
    estimated_value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name="Valor estimado (opcional)",
    )
    is_available = models.BooleanField(default=True, verbose_name="Disponible")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Producto"
        verbose_name_plural = "Productos"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.owner.email})"


class ProductImage(models.Model):
    """
    Imagen asociada a un producto. Se sube a Cloudinary.
    Límite de tamaño validado en el Serializer (≤ 10MB).
    """
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="images",
        verbose_name="Producto",
    )
    image = CloudinaryField(
        "Imagen del producto",
        folder="marketplace/products",
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Imagen de producto"
        verbose_name_plural = "Imágenes de producto"
