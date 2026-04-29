"""
Registro de modelos de productos en el panel de administración.
"""
from django.contrib import admin
from .models import Product, ProductImage


class ProductImageInline(admin.TabularInline):
    """Muestra las imágenes dentro del panel de cada producto."""
    model = ProductImage
    extra = 0
    readonly_fields = ["uploaded_at"]


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    """Panel de administración para Productos."""
    list_display = ["title", "owner", "category", "is_available", "created_at"]
    list_filter = ["category", "is_available"]
    search_fields = ["title", "description", "owner__email"]
    ordering = ["-created_at"]
    inlines = [ProductImageInline]
