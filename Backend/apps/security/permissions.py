import logging

from rest_framework import permissions

logger = logging.getLogger(__name__)


class IsOwnerOrReadOnly(permissions.BasePermission):

    def has_object_permission(self, request, view, obj):
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
