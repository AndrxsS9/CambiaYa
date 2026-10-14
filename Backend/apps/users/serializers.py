"""
Serializers de la app users.
Cubre: registro con validaciones de negocio y visualización/edición de perfil.
"""
import logging
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import CustomUser

logger = logging.getLogger(__name__)


class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer para el endpoint POST /api/v1/auth/register/.
    Valida email único y contraseña de al menos 8 caracteres.
    """
    password = serializers.CharField(write_only=True, min_length=8)
    
    # Redefinimos email para evitar el UniqueValidator automático de DRF 
    # y aplicar el mensaje manual en validate_email.
    email = serializers.EmailField()

    class Meta:
        model = CustomUser
        fields = ["id", "email", "name", "password"]
        extra_kwargs = {
            "id": {"read_only": True},
        }

    def validate_email(self, value):
        """Verifica que el email no esté registrado previamente con mensaje personalizado."""
        if CustomUser.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Este correo ya está registrado.")
        return value.lower()

    def validate_password(self, value):
        """Aplica validadores de contraseña de Django (mínimo 8 caracteres)."""
        validate_password(value)
        return value

    def create(self, validated_data):
        """Crea el usuario con la contraseña hasheada."""
        user = CustomUser.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            name=validated_data["name"],
        )
        logger.info("Usuario registrado exitosamente: %s", user.email)
        return user


class ProfileSerializer(serializers.ModelSerializer):
    """
    Serializer para GET/PUT /api/v1/users/me/.
    Expone campos públicos del perfil; nunca incluye el password.
    Incluye validaciones de negocio para nombre, ubicación y foto.
    """
    profile_picture_url = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ["id", "email", "name", "bio", "location", "profile_picture_url", "profile_picture"]
        extra_kwargs = {
            "id": {"read_only": True},
            "email": {"read_only": True},
            "profile_picture": {"write_only": True, "required": False},
        }

    def validate_name(self, value):
        """Valida que el nombre tenga entre 2 y 100 caracteres."""
        stripped = value.strip()
        if len(stripped) < 2:
            raise serializers.ValidationError("El nombre debe tener al menos 2 caracteres.")
        if len(stripped) > 100:
            raise serializers.ValidationError("El nombre no puede superar los 100 caracteres.")
        return stripped

    def validate_location(self, value):
        """Valida que la ubicación no supere 150 caracteres."""
        stripped = value.strip()
        if len(stripped) > 150:
            raise serializers.ValidationError("La ubicación no puede superar los 150 caracteres.")
        return stripped

    def validate_bio(self, value):
        """Valida que la biografía no supere 500 caracteres."""
        if len(value) > 500:
            raise serializers.ValidationError("La biografía no puede superar los 500 caracteres.")
        return value

    def validate_profile_picture(self, value):
        """Valida tipo de archivo (JPEG, PNG, WebP) y tamaño máximo (10MB)."""
        allowed_types = ["image/jpeg", "image/png", "image/webp"]
        max_size = 10 * 1024 * 1024  # 10MB

        if value.content_type not in allowed_types:
            raise serializers.ValidationError(
                "Formato no permitido. Solo se aceptan imágenes JPEG, PNG o WebP."
            )
        if value.size > max_size:
            raise serializers.ValidationError(
                "La imagen no puede superar los 10MB."
            )
        return value

    def get_profile_picture_url(self, obj):
        """Retorna la URL pública de Cloudinary si existe."""
        if obj.profile_picture:
            return obj.profile_picture.url
        return None
