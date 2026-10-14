import logging
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .serializers import RegisterSerializer, ProfileSerializer
from .models import CustomUser

logger = logging.getLogger(__name__)


class RegisterView(generics.CreateAPIView):
    """
    POST /api/v1/auth/register/
    Registra un nuevo usuario. Endpoint público.
    Retorna 201 con {id, email, name} en éxito.
    """
    queryset = CustomUser.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        # Solo retornar datos públicos, nunca el password
        return Response(
            {"id": user.id, "email": user.email, "name": user.name},
            status=status.HTTP_201_CREATED,
        )


class MeView(generics.RetrieveUpdateAPIView):
    """
    GET /api/v1/users/me/  → Retorna el perfil del usuario autenticado.
    PUT /api/v1/users/me/  → Actualiza campos del perfil (incluye foto vía Cloudinary).
    Requiere Bearer Token.
    """
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        """El objeto siempre es el usuario autenticado."""
        return self.request.user

    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True  # Permite PATCH implícito en PUT
        logger.info("Perfil actualizado por usuario: %s", request.user.email)
        return super().update(request, *args, **kwargs)
