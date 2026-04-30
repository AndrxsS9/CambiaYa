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


class ProfileTests(APITestCase):
    """Tests unitarios para el endpoint de perfil GET/PUT /api/v1/users/me/."""

    def setUp(self):
        self.profile_url = reverse('users-me')
        self.user = CustomUser.objects.create_user(
            email="profile@test.com",
            password="Password123!",
            name="Profile User"
        )

    def _auth_header(self):
        """Obtiene el token JWT y retorna el header de autenticación."""
        login_url = reverse('auth-login')
        response = self.client.post(login_url, {
            "email": "profile@test.com",
            "password": "Password123!"
        })
        token = response.data['access']
        return {"HTTP_AUTHORIZATION": f"Bearer {token}"}

    def test_get_profile_authenticated(self):
        """Prueba que un usuario autenticado pueda obtener su perfil."""
        response = self.client.get(self.profile_url, **self._auth_header())
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], "profile@test.com")
        self.assertEqual(response.data['name'], "Profile User")
        self.assertIn('bio', response.data)
        self.assertIn('location', response.data)
        self.assertIn('profile_picture_url', response.data)
        self.assertNotIn('password', response.data)

    def test_get_profile_unauthenticated(self):
        """Prueba que sin token se retorne 401."""
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_profile_name_bio_location(self):
        """Prueba la actualización exitosa de nombre, bio y ubicación."""
        data = {
            "name": "Cristian Yela",
            "bio": "Intercambio libros de ingeniería",
            "location": "Pasto, Facultad de Ingeniería"
        }
        response = self.client.put(
            self.profile_url, data, format='json', **self._auth_header()
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], "Cristian Yela")
        self.assertEqual(response.data['bio'], "Intercambio libros de ingeniería")
        self.assertEqual(response.data['location'], "Pasto, Facultad de Ingeniería")

    def test_update_profile_empty_name(self):
        """Prueba que un nombre vacío retorne error de validación."""
        data = {"name": " "}
        response = self.client.put(
            self.profile_url, data, format='json', **self._auth_header()
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)

    def test_update_profile_unauthenticated(self):
        """Prueba que actualizar perfil sin token retorne 401."""
        data = {"name": "Hacker"}
        response = self.client.put(self.profile_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
