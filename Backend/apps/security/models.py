"""
Modelos de seguridad para el control de intentos de inicio de sesión.

Registra cada intento de login y gestiona los bloqueos temporales
por intentos fallidos consecutivos.
"""
import logging

from django.db import models
from django.utils.timezone import now

logger = logging.getLogger(__name__)


class LoginAttempt(models.Model):
    """Registra cada intento de inicio de sesión (exitoso o fallido)."""

    email = models.EmailField(
        db_index=True,
        verbose_name="Correo electrónico",
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        verbose_name="Dirección IP",
    )
    successful = models.BooleanField(
        default=False,
        verbose_name="¿Fue exitoso?",
    )
    timestamp = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Fecha y hora del intento",
    )

    class Meta:
        indexes = [
            models.Index(fields=['email', 'timestamp']),
        ]
        ordering = ['-timestamp']
        verbose_name = "Intento de inicio de sesión"
        verbose_name_plural = "Intentos de inicio de sesión"

    def __str__(self):
        status = "exitoso" if self.successful else "fallido"
        return f"Intento {status} — {self.email} ({self.timestamp})"


class AccountLockout(models.Model):
    """Bloqueo temporal de una cuenta tras superar el límite de intentos fallidos."""

    email = models.EmailField(
        unique=True,
        verbose_name="Correo electrónico",
    )
    locked_until = models.DateTimeField(
        verbose_name="Bloqueado hasta",
    )
    attempt_count = models.IntegerField(
        default=0,
        verbose_name="Cantidad de intentos fallidos",
    )

    class Meta:
        verbose_name = "Bloqueo de cuenta"
        verbose_name_plural = "Bloqueos de cuenta"

    def __str__(self):
        return f"Bloqueo — {self.email} (hasta {self.locked_until})"

    def is_locked(self):
        """Verifica si el bloqueo sigue activo comparando con la hora actual."""
        locked = self.locked_until > now()
        if locked:
            logger.info("Cuenta %s sigue bloqueada hasta %s", self.email, self.locked_until)
        return locked
