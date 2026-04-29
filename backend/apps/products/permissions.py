"""
Permiso personalizado: solo el dueño puede modificar o eliminar un producto.
Lectura permitida a todos (SAFE_METHODS).
Regla de negocio: business_rules.md → IsOwnerOrReadOnly.
"""
from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsOwnerOrReadOnly(BasePermission):
    """
    Permite GET, HEAD, OPTIONS a cualquier usuario.
    Restringe POST, PUT, PATCH, DELETE al dueño del objeto.
    """

    def has_object_permission(self, request, view, obj):
        # Métodos de solo lectura son siempre permitidos
        if request.method in SAFE_METHODS:
            return True
        # Solo el propietario puede modificar
        return obj.owner == request.user
