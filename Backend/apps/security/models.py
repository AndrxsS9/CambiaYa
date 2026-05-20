import logging
from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

logger = logging.getLogger(__name__)


class PrivacyConsent(models.Model):
    """
    Registro de consentimiento de tratamiento de datos personales.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="privacy_consents",
        verbose_name=_("Usuario"),
    )
    accepted_privacy_policy = models.BooleanField(
        _("Aceptó política de privacidad"),
        default=False,
    )
    accepted_data_treatment = models.BooleanField(
        _("Aceptó tratamiento de datos"),
        default=False,
    )
    policy_version = models.CharField(
        _("Versión de la política"),
        max_length=10,
        default="1.0",
    )
    ip_address = models.GenericIPAddressField(
        _("Dirección IP"),
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(
        _("Fecha de consentimiento"),
        auto_now_add=True,
    )

    class Meta:
        verbose_name = _("Consentimiento de privacidad")
        verbose_name_plural = _("Consentimientos de privacidad")
        ordering = ["-created_at"]

    def __str__(self):
        return f"Consentimiento de {self.user} - {self.created_at}"
