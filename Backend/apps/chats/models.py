import logging
from django.db import models
from django.conf import settings

logger = logging.getLogger(__name__)


class Message(models.Model):
    """
    Representa un mensaje de chat entre dos usuarios de la plataforma.
    """
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_messages",
        verbose_name="Remitente",
    )
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="received_messages",
        verbose_name="Destinatario",
    )
    content = models.TextField(verbose_name="Contenido del mensaje")
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de envío")
    is_read = models.BooleanField(default=False, verbose_name="Leído")

    class Meta:
        verbose_name = "Mensaje"
        verbose_name_plural = "Mensajes"
        ordering = ["timestamp"]

    def __str__(self):
        return f"De {self.sender.email} a {self.recipient.email} en {self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}"
