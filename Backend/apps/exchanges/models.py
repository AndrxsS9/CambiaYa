from django.conf import settings
from django.db import models


class ExchangeProposal(models.Model):

    STATUS_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('aceptada', 'Aceptada'),
        ('rechazada', 'Rechazada'),
        ('cancelada', 'Cancelada'),
    ]

    proposer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_proposals',
        verbose_name="Proponente",
        help_text="Usuario que hace la oferta de intercambio.",
    )
    offered_product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='offered_in_proposals',
        verbose_name="Producto ofrecido",
        help_text="Producto que el proponente ofrece a cambio.",
    )
    requested_product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='requested_in_proposals',
        verbose_name="Producto solicitado",
        help_text="Producto que el proponente desea obtener.",
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pendiente',
        verbose_name="Estado",
    )
    message = models.TextField(
        blank=True,
        default='',
        verbose_name="Mensaje",
        help_text="Mensaje opcional del proponente al dueño del producto solicitado.",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Fecha de creación",
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Última actualización",
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Propuesta de intercambio"
        verbose_name_plural = "Propuestas de intercambio"
        constraints = [
            models.UniqueConstraint(
                fields=['offered_product', 'requested_product'],
                condition=models.Q(status='pendiente'),
                name='unique_pending_proposal',
            ),
        ]

    def __str__(self):
        return (
            f"Propuesta #{self.pk}: "
            f"{self.offered_product.title} ↔ {self.requested_product.title} "
            f"({self.get_status_display()})"
        )

    @property
    def receiver(self):
        return self.requested_product.owner
