"""
Permisos personalizados — CambiaYa.
Ítem 13, Tarea 4: Validación de permisos de usuario.

Clases de permisos reutilizables que los demás módulos pueden usar
para proteger sus endpoints según el rol o estado del usuario.
"""
import logging
from rest_framework.permissions import BasePermission

logger = logging.getLogger(__name__)


class IsOwnerOrReadOnly(BasePermission):
    """
    Solo permite escritura al propietario del recurso.
    """
    message = "Solo el propietario puede modificar este recurso."

    def has_object_permission(self, request, view, obj):
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True
        is_owner = obj.owner == request.user
        if not is_owner:
            logger.warning(
                "Acceso denegado: usuario %s intentó modificar recurso de %s",
                request.user.email, obj.owner.email,
            )
        return is_owner


class IsActiveUser(BasePermission):
    """
    Solo permite acceso a usuarios con cuenta activa.
    """
    message = "Su cuenta está desactivada. Contacte al administrador."

    def has_permission(self, request, view):
        """Verifica que el usuario esté activo."""
        return (
            request.user
            and request.user.is_authenticated
            and request.user.is_active
        )


class IsAdminUser(BasePermission):
    """
    Solo permite acceso a usuarios con permisos de staff/admin.
    """
    message = "Se requieren permisos de administrador."

    def has_permission(self, request, view):
        """Verifica que el usuario sea staff."""
        return (
            request.user
            and request.user.is_authenticated
            and request.user.is_staff
        )
