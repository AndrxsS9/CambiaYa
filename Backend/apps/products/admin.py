from django.contrib import admin
from .models import Product, ProductImage


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 0
    readonly_fields = ["uploaded_at"]


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ["title", "owner", "category", "created_at"]
    list_filter = ["category"]
    search_fields = ["title", "description", "owner__email"]
    ordering = ["-created_at"]
    inlines = [ProductImageInline]
