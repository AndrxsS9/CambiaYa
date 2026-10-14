"""
Validador de fortaleza de contraseña — CambiaYa.
Ítem 13, Tarea 1: Implementación de cifrado de contraseñas (hash).

Django usa PBKDF2 por defecto para hashear. Este validador agrega
reglas de fortaleza para garantizar contraseñas seguras antes del hash.
"""
import re
import logging
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

logger = logging.getLogger(__name__)


class StrongPasswordValidator:
    """
    Valida que la contraseña cumpla criterios de fortaleza:
    """

    def validate(self, password, user=None):
        errors = []

        if not re.search(r"[A-Z]", password):
            errors.append(
                _("La contraseña debe contener al menos una letra mayúscula.")
            )
        if not re.search(r"[a-z]", password):
            errors.append(
                _("La contraseña debe contener al menos una letra minúscula.")
            )
        if not re.search(r"[0-9]", password):
            errors.append(
                _("La contraseña debe contener al menos un número.")
            )
        if not re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?]", password):
            errors.append(
                _("La contraseña debe contener al menos un carácter especial (!@#$%^&*...).")
            )

        if errors:
            logger.warning("Contraseña rechazada por no cumplir criterios de fortaleza.")
            raise ValidationError(errors)

    def get_help_text(self):
        """Texto de ayuda para el usuario."""
        return _(
            "La contraseña debe contener al menos: una mayúscula, "
            "una minúscula, un número y un carácter especial."
        )
