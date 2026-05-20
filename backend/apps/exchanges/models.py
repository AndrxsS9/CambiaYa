import logging
from django.db import models
from django.conf import settings
from apps.products.models import Product

logger = logging.getLogger(__name__)


class ExchangeProposal(models.Model):
    """
    Representa una propuesta de intercambio entre dos usuarios.
    Contiene un producto solicitado (requested_product) y un producto ofertado (offered_product).
    """
    STATUS_CHOICES = [
        ("pending", "Pendiente"),
        ("accepted", "Aceptado"),
        ("rejected", "Rechazado"),
        ("cancelled", "Cancelado"),
    ]

    proposer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="proposed_exchanges",
        verbose_name="Proponente",
    )
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="received_exchanges",
        verbose_name="Receptor",
    )
    requested_product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="requested_in_proposals",
        verbose_name="Producto Solicitado",
    )
    offered_product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="offered_in_proposals",
        null=True,
        blank=True,
        verbose_name="Producto Ofertado",
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending",
        verbose_name="Estado de la propuesta",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Propuesta de Intercambio"
        verbose_name_plural = "Propuestas de Intercambio"
        ordering = ["-created_at"]

    def __str__(self):
        offered_title = self.offered_product.title if self.offered_product else "Nada"
        return f"{self.proposer.email} ofrece '{offered_title}' por '{self.requested_product.title}' de {self.receiver.email} ({self.get_status_display()})"
