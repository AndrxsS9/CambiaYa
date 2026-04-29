"""
Tests unitarios para el módulo de Autenticación.
Cubre: Registro exitoso, email duplicado, password débil y login.
"""
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from apps.users.models import CustomUser

class AuthTests(APITestCase):
    def setUp(self):
        self.register_url = reverse('auth-register')
        self.login_url = reverse('auth-login')
        self.user_data = {
            "email": "test@user.com",
            "password": "Password123!",
            "name": "Test User"
        }

    def test_register_success(self):
        """Prueba que un usuario se pueda registrar con datos válidos."""
        response = self.client.post(self.register_url, self.user_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['email'], self.user_data['email'])
        self.assertNotIn('password', response.data)

    def test_register_duplicate_email(self):
        """Prueba que no se permita registrar un email ya existente."""
        CustomUser.objects.create_user(**self.user_data)
        response = self.client.post(self.register_url, self.user_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("ya está registrado", str(response.data['email'][0]))

    def test_register_weak_password(self):
        """Prueba que se rechacen contraseñas cortas (min 8 chars)."""
        data = self.user_data.copy()
        data['password'] = '123'
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_success(self):
        """Prueba el login y obtención de tokens JWT."""
        CustomUser.objects.create_user(**self.user_data)
        response = self.client.post(self.login_url, {
            "email": self.user_data['email'],
            "password": self.user_data['password']
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_login_fail(self):
        """Prueba error 401 genérico en login fallido."""
        response = self.client.post(self.login_url, {
            "email": "wrong@user.com",
            "password": "wrongpassword"
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
