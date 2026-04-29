import logging
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .models import PrivacyConsent
from .serializers import PrivacyConsentSerializer

logger = logging.getLogger(__name__)


def _get_client_ip(request):
    """Obtiene la IP real del cliente considerando proxies."""
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


@api_view(["GET"])
@permission_classes([AllowAny])
def privacy_policy_view(request):
    """
    Retorna la política de tratamiento de datos personales.
    """
    return Response({
        "title": "Política de Tratamiento de Datos Personales — CambiaYa",
        "last_updated": "2026-04-29",
        "version": "1.0",
        "sections": [
            {
                "title": "1. Responsable del tratamiento",
                "content": (
                    "CambiaYa es responsable del tratamiento de los datos personales "
                    "recopilados a través de la plataforma."
                ),
            },
            {
                "title": "2. Datos que recopilamos",
                "content": (
                    "Recopilamos: nombre, correo electrónico e información "
                    "de los productos/servicios publicados para intercambio."
                ),
            },
            {
                "title": "3. Finalidad del tratamiento",
                "content": (
                    "Sus datos se utilizan para: verificar su identidad, facilitar "
                    "intercambios entre usuarios y mejorar nuestros servicios."
                ),
            },
            {
                "title": "4. Derechos del titular",
                "content": (
                    "Usted tiene derecho a conocer, actualizar, rectificar y "
                    "eliminar sus datos personales, así como a revocar su "
                    "consentimiento en cualquier momento."
                ),
            },
            {
                "title": "5. Seguridad",
                "content": (
                    "Implementamos cifrado de contraseñas (hash), cabeceras de "
                    "seguridad HTTP, autenticación JWT y control de acceso "
                    "basado en permisos para proteger su información."
                ),
            },
            {
                "title": "6. Compartir información",
                "content": (
                    "No compartimos su información con terceros sin su "
                    "consentimiento explícito, salvo requerimiento legal."
                ),
            },
        ],
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def accept_privacy_view(request):
    """
    Registra el consentimiento del usuario.
    POST /api/v1/security/accept-privacy/
    """
    serializer = PrivacyConsentSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(
            user=request.user,
            ip_address=_get_client_ip(request),
        )
        logger.info("Consentimiento registrado para usuario: %s", request.user.email)
        return Response(
            {"message": "Consentimiento registrado exitosamente."},
            status=status.HTTP_201_CREATED,
        )

    return Response(
        {"message": "Error al registrar consentimiento.", "errors": serializer.errors},
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_consent_view(request):
    """
    Consulta el estado actual de consentimiento del usuario.
    """
    latest = PrivacyConsent.objects.filter(user=request.user).first()
    if not latest:
        return Response({
            "has_consent": False,
            "message": "No ha aceptado la política de privacidad.",
        })

    return Response({
        "has_consent": True,
        "consent": PrivacyConsentSerializer(latest).data,
    })
