"""
Modelo de usuario personalizado para CambiaYa.

Extiende AbstractUser para usar el email como campo principal de autenticación
en lugar del username por defecto de Django.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Usuario del marketplace CambiaYa. Se autentica por email."""

    email = models.EmailField(
        unique=True,
        verbose_name="Correo electrónico",
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"

    def __str__(self):
        return f"{self.get_full_name()} ({self.email})"
