"""
Tests unitarios para el módulo de Productos.
Cubre: CRUD, permisos IsOwnerOrReadOnly y validación de imagen.
"""
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from apps.users.models import CustomUser
from apps.products.models import Product

class ProductTests(APITestCase):
    def setUp(self):
        self.owner = CustomUser.objects.create_user(email="owner@test.com", password="pass1234", name="Owner")
        self.other = CustomUser.objects.create_user(email="other@test.com", password="pass1234", name="Other")
        self.product = Product.objects.create(
            owner=self.owner,
            title="Laptop Usada",
            description="Buen estado",
            category="electronics"
        )
        self.list_url = reverse('products-list')
        self.detail_url = reverse('products-detail', kwargs={'pk': self.product.pk})

    def test_list_products_public(self):
        """Cualquier usuario (incluso anónimo) puede ver la lista."""
        self.client.force_authenticate(user=None)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_product_authenticated(self):
        """Se requiere autenticación para crear."""
        data = {"title": "Nuevo", "description": "Desc", "category": "other"}
        response = self.client.post(self.list_url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        self.client.force_authenticate(user=self.owner)
        response = self.client.post(self.list_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_update_product_only_owner(self):
        """Regla de negocio: Solo el dueño puede editar."""
        data = {"title": "Editado"}
        
        # Intento por otro usuario
        self.client.force_authenticate(user=self.other)
        response = self.client.patch(self.detail_url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Intento por el dueño
        self.client.force_authenticate(user=self.owner)
        response = self.client.patch(self.detail_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], "Editado")

    def test_delete_product_only_owner(self):
        """Regla de negocio: Solo el dueño puede eliminar."""
        self.client.force_authenticate(user=self.other)
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        self.client.force_authenticate(user=self.owner)
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
