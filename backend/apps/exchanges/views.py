import logging
from django.db.models import Q
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.products.models import Product
from .models import ExchangeProposal
from .serializers import ExchangeProposalSerializer

logger = logging.getLogger(__name__)


class ExchangeProposalViewSet(viewsets.ModelViewSet):
    """
    ViewSet para propuestas de intercambio.
    Maneja la creación, aceptación, rechazo, cancelación e historial de propuestas.
    """
    serializer_class = ExchangeProposalSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = ExchangeProposal.objects.all()

    def get_queryset(self):
        """
        Retorna propuestas donde el usuario es proponente o receptor.
        Permite filtrar opcionalmente por estado (?status=pending).
        """
        user = self.request.user
        queryset = super().get_queryset().filter(Q(proposer=user) | Q(receiver=user)).select_related(
            "proposer", "receiver", "requested_product", "offered_product"
        )
        
        status_param = self.request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param)
            
        return queryset

    def perform_create(self, serializer):
        """
        Asigna el proponente (proposer) al usuario autenticado y el receptor (receiver)
        al dueño del producto solicitado.
        """
        requested_product = serializer.validated_data["requested_product"]
        serializer.save(
            proposer=self.request.user,
            receiver=requested_product.owner,
            status="pending"
        )
        logger.info(
            "Propuesta creada por %s solicitando '%s' a %s",
            self.request.user.email,
            requested_product.title,
            requested_product.owner.email,
        )

    @action(detail=True, methods=["patch"])
    def accept(self, request, pk=None):
        """
        PATCH /api/v1/exchanges/proposals/{id}/accept/
        Acepta una propuesta de intercambio (Solo el receptor).
        Marca ambos productos como no disponibles y cancela propuestas conflictivas.
        """
        proposal = self.get_object()

        # 1. Validar que el usuario logueado sea el receptor
        if proposal.receiver != request.user:
            return Response(
                {"error": "Solo el destinatario de la propuesta puede aceptarla."},
                status=status.HTTP_403_FORBIDDEN
            )

        # 2. Validar que la propuesta esté pendiente
        if proposal.status != "pending":
            return Response(
                {"error": f"No se puede aceptar una propuesta que ya está en estado: {proposal.status}."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3. Validar disponibilidad de productos
        req_product = proposal.requested_product
        off_product = proposal.offered_product

        if not req_product.is_available:
            return Response(
                {"error": f"Tu producto '{req_product.title}' ya no está disponible para intercambio."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if off_product and not off_product.is_available:
            return Response(
                {"error": f"El producto ofrecido '{off_product.title}' ya no está disponible."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 4. Transición de estado de la propuesta
        proposal.status = "accepted"
        proposal.save()

        # 5. Marcar productos como no disponibles
        req_product.is_available = False
        req_product.save()

        if off_product:
            off_product.is_available = False
            off_product.save()

        # 6. Integridad (RNF08): Cancelar automáticamente otras propuestas pendientes del mismo producto solicitado
        # O del producto ofrecido
        conflict_proposals = ExchangeProposal.objects.filter(
            status="pending"
        ).filter(
            Q(requested_product=req_product) | 
            Q(offered_product=req_product) |
            (Q(requested_product=off_product) if off_product else Q(id=0)) |
            (Q(offered_product=off_product) if off_product else Q(id=0))
        ).exclude(id=proposal.id)
        
        count = conflict_proposals.count()
        conflict_proposals.update(status="cancelled")

        logger.info(
            "Propuesta %d aceptada. Productos marcados no disponibles. Se cancelaron %d propuestas conflictivas.",
            proposal.id,
            count
        )

        return Response(
            {
                "message": "Propuesta aceptada con éxito.",
                "proposal": ExchangeProposalSerializer(proposal).data,
                "cancelled_conflict_count": count
            },
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=["patch"])
    def reject(self, request, pk=None):
        """
        PATCH /api/v1/exchanges/proposals/{id}/reject/
        Rechaza una propuesta de intercambio (Solo el receptor).
        """
        proposal = self.get_object()

        if proposal.receiver != request.user:
            return Response(
                {"error": "Solo el destinatario de la propuesta puede rechazarla."},
                status=status.HTTP_403_FORBIDDEN
            )

        if proposal.status != "pending":
            return Response(
                {"error": "Solo se pueden rechazar propuestas pendientes."},
                status=status.HTTP_400_BAD_REQUEST
            )

        proposal.status = "rejected"
        proposal.save()
        
        logger.info("Propuesta %d rechazada por %s", proposal.id, request.user.email)
        return Response(
            {
                "message": "Propuesta rechazada con éxito.",
                "proposal": ExchangeProposalSerializer(proposal).data
            },
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=["patch"])
    def cancel(self, request, pk=None):
        """
        PATCH /api/v1/exchanges/proposals/{id}/cancel/
        Cancela una propuesta de intercambio (Solo el proponente).
        """
        proposal = self.get_object()

        if proposal.proposer != request.user:
            return Response(
                {"error": "Solo el creador de la propuesta puede cancelarla."},
                status=status.HTTP_403_FORBIDDEN
            )

        if proposal.status != "pending":
            return Response(
                {"error": "Solo se pueden cancelar propuestas pendientes."},
                status=status.HTTP_400_BAD_REQUEST
            )

        proposal.status = "cancelled"
        proposal.save()
        
        logger.info("Propuesta %d cancelada por %s", proposal.id, request.user.email)
        return Response(
            {
                "message": "Propuesta cancelada con éxito.",
                "proposal": ExchangeProposalSerializer(proposal).data
            },
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=["get"])
    def history(self, request):
        """
        GET /api/v1/exchanges/proposals/history/
        Historial de intercambios realizados: retorna propuestas aceptadas, rechazadas o canceladas del usuario.
        """
        user = request.user
        history_proposals = ExchangeProposal.objects.filter(
            Q(proposer=user) | Q(receiver=user)
        ).exclude(status="pending").select_related(
            "proposer", "receiver", "requested_product", "offered_product"
        ).order_by("-updated_at")

        serializer = ExchangeProposalSerializer(history_proposals, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
