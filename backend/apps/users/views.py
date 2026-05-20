"""
Vistas de autenticación del módulo de usuarios.

Contiene la vista de registro de nuevos usuarios y la vista
personalizada de login con protección contra ataques de fuerza bruta.
"""
import logging

from datetime import timedelta

from django.utils.timezone import now
from rest_framework import generics, status
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

from apps.security.models import AccountLockout, LoginAttempt
from .serializers import RegisterSerializer

logger = logging.getLogger(__name__)

# Constantes de configuración del bloqueo
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION_MINUTES = 15


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Vista personalizada de obtención de tokens JWT.

    Extiende TokenObtainPairView para implementar:
    - Verificación de bloqueo de cuenta antes de autenticar.
    - Registro de cada intento de login (exitoso o fallido).
    - Bloqueo temporal tras superar el umbral de intentos fallidos.
    """

    def _get_client_ip(self, request):
        """Extrae la dirección IP real del cliente desde los headers de la petición."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')

    def _check_lockout(self, email):
        """
        Verifica si la cuenta está bloqueada.

        Retorna una Response con status 429 si hay un bloqueo activo,
        o None si la cuenta puede proceder con el login.
        """
        lockout = AccountLockout.objects.filter(email=email).first()
        if lockout and lockout.is_locked():
            remaining_time = lockout.locked_until - now()
            minutes = max(int(remaining_time.total_seconds() // 60) + 1, 1)
            logger.warning("Intento de login en cuenta bloqueada: %s", email)
            return Response(
                {"detail": f"Tu cuenta está bloqueada temporalmente. Intenta de nuevo en {minutes} minutos."},
                status=429,
            )
        return None

    def _record_attempt(self, email, ip_address, successful):
        """Registra un intento de inicio de sesión en la base de datos."""
        LoginAttempt.objects.create(
            email=email,
            ip_address=ip_address,
            successful=successful,
        )
        result = "exitoso" if successful else "fallido"
        logger.info("Intento de login %s para %s desde %s", result, email, ip_address)

    def _handle_failed_attempt(self, email):
        """
        Evalúa si se debe bloquear la cuenta tras un intento fallido.

        Cuenta los intentos fallidos dentro de la ventana de tiempo
        y crea o actualiza un AccountLockout si se superó el umbral.
        """
        recent_failures = LoginAttempt.objects.filter(
            email=email,
            successful=False,
            timestamp__gte=now() - timedelta(minutes=LOCKOUT_DURATION_MINUTES),
        ).count()

        if recent_failures >= MAX_FAILED_ATTEMPTS:
            lockout, created = AccountLockout.objects.update_or_create(
                email=email,
                defaults={
                    'locked_until': now() + timedelta(minutes=LOCKOUT_DURATION_MINUTES),
                    'attempt_count': recent_failures,
                },
            )
            action = "creado" if created else "actualizado"
            logger.warning(
                "Bloqueo %s para %s — %d intentos fallidos recientes",
                action,
                email,
                recent_failures,
            )

    def post(self, request, *args, **kwargs):
        """
        Procesa la petición de login con protección contra fuerza bruta.

        Flujo:
        1. Extraer email e IP del request.
        2. Verificar si la cuenta está bloqueada → 429 si lo está.
        3. Intentar autenticación con la vista padre.
        4. Si es exitosa → registrar intento exitoso, limpiar bloqueos.
        5. Si falla → registrar intento fallido, evaluar si bloquear.
        """
        email = request.data.get("email") or request.data.get("username")
        ip_address = self._get_client_ip(request)

        if email:
            lockout_response = self._check_lockout(email)
            if lockout_response:
                return lockout_response

        try:
            response = super().post(request, *args, **kwargs)

            if email:
                self._record_attempt(email, ip_address, successful=True)
                AccountLockout.objects.filter(email=email).delete()

            return response

        except AuthenticationFailed:
            if email:
                self._record_attempt(email, ip_address, successful=False)
                self._handle_failed_attempt(email)

            return Response(
                {"detail": "Credenciales inválidas"},
                status=status.HTTP_401_UNAUTHORIZED,
            )


class RegisterView(generics.CreateAPIView):
    """
    Vista de registro de nuevos usuarios.

    Permite crear una cuenta enviando email, nombre y contraseña.
    No requiere autenticación (AllowAny).
    """

    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        """Registra un nuevo usuario y retorna sus datos (sin password)."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        logger.info("Nuevo usuario registrado: %s", user.email)
        return Response(
            {"detail": "Usuario registrado exitosamente."},
            status=status.HTTP_201_CREATED,
        )

