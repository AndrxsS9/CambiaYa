"""
Permisos reutilizables para todo el proyecto CambiaYa.

Este módulo centraliza los permisos personalizados evitando duplicación
entre las distintas apps (DRY).
"""
import logging

from rest_framework import permissions

logger = logging.getLogger(__name__)


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Permite lectura a cualquier usuario, pero solo permite escritura
    (PUT, PATCH, DELETE) al propietario del objeto.
    """

    def has_object_permission(self, request, view, obj):
        """Evalúa si la petición es de solo lectura o si el usuario es el dueño."""
        if request.method in permissions.SAFE_METHODS:
            return True

        is_owner = obj.owner == request.user
        if not is_owner:
            logger.warning(
                "Intento de modificación denegado — usuario %s intentó modificar objeto de %s",
                request.user,
                obj.owner,
            )
        return is_owner
