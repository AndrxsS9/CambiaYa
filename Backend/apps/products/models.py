from django.conf import settings
from django.db import models


class Product(models.Model):

    CATEGORY_CHOICES = [
        ('Electrónica', 'Electrónica'),
        ('Ropa', 'Ropa'),
        ('Libros', 'Libros'),
        ('Deportes', 'Deportes'),
        ('Hogar', 'Hogar'),
        ('Otro', 'Otro'),
    ]

    title = models.CharField(
        max_length=200,
        verbose_name="Título",
    )
    description = models.TextField(
        verbose_name="Descripción",
    )
    category = models.CharField(
        max_length=50,
        choices=CATEGORY_CHOICES,
        default='Otro',
        verbose_name="Categoría",
    )
    estimated_value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Valor estimado",
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='products',
        verbose_name="Propietario",
    )
    available = models.BooleanField(
        default=True,
        verbose_name="Disponible",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Fecha de creación",
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Última actualización",
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Producto"
        verbose_name_plural = "Productos"

    def __str__(self):
        return f"{self.title} — {self.owner.email}"


class ProductImage(models.Model):

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='images',
        verbose_name="Producto",
    )
    image = models.ImageField(
        upload_to='products/',
        verbose_name="Imagen",
    )
    uploaded_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Fecha de subida",
    )

    class Meta:
        verbose_name = "Imagen de producto"
        verbose_name_plural = "Imágenes de producto"

    def __str__(self):
        return f"Imagen de {self.product.title}"
