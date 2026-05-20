"""
Modelo de usuario personalizado — usa email como USERNAME_FIELD.
Campos extra: name, bio, location, profile_picture (Cloudinary).
"""
import logging
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from cloudinary.models import CloudinaryField

logger = logging.getLogger(__name__)


class CustomUserManager(BaseUserManager):
    """Gestor personalizado que usa email en lugar de username."""

    def create_user(self, email, password=None, **extra_fields):
        """Crea y guarda un usuario estándar."""
        if not email:
            raise ValueError("El correo electrónico es obligatorio.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        logger.info("Nuevo usuario creado: %s", email)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """Crea y guarda un superusuario."""
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    """
    Usuario del Marketplace de Intercambio.
    El email es el identificador único de autenticación.
    """
    email = models.EmailField(unique=True, verbose_name="Correo electrónico")
    name = models.CharField(max_length=100, verbose_name="Nombre completo")
    bio = models.TextField(blank=True, default="", verbose_name="Biografía")
    location = models.CharField(max_length=150, blank=True, default="", verbose_name="Ubicación")
    profile_picture = CloudinaryField(
        "Foto de perfil",
        folder="marketplace/profile_pictures",
        blank=True,
        null=True,
    )

    # Campos de control de acceso
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = CustomUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name"]

    class Meta:
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"

    def __str__(self):
        return self.email
