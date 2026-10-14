import logging

from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import ExchangeProposal
from .serializers import ExchangeProposalSerializer, ExchangeProposalCreateSerializer

logger = logging.getLogger(__name__)


class ExchangeProposalViewSet(viewsets.ModelViewSet):

    serializer_class = ExchangeProposalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = ExchangeProposal.objects.select_related(
            'proposer',
            'offered_product__owner',
            'requested_product__owner',
        ).prefetch_related(
            'offered_product__images',
            'requested_product__images',
        ).filter(
            Q(proposer=user) | Q(requested_product__owner=user)
        )
        proposal_type = self.request.query_params.get('type')
        if proposal_type == 'sent':
            queryset = queryset.filter(proposer=user)
        elif proposal_type == 'received':
            queryset = queryset.filter(requested_product__owner=user)
        proposal_status = self.request.query_params.get('status')
        if proposal_status:
            queryset = queryset.filter(status=proposal_status)

        return queryset

    def get_serializer_class(self):
        if self.action == 'create':
            return ExchangeProposalCreateSerializer
        return ExchangeProposalSerializer

    def perform_create(self, serializer):
        proposal = serializer.save(proposer=self.request.user)
        logger.info(
            "Propuesta creada #%d: '%s' ↔ '%s' por %s",
            proposal.pk,
            proposal.offered_product.title,
            proposal.requested_product.title,
            self.request.user.email,
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        proposal = ExchangeProposal.objects.select_related(
            'proposer',
            'offered_product__owner',
            'requested_product__owner',
        ).prefetch_related(
            'offered_product__images',
            'requested_product__images',
        ).get(pk=serializer.instance.pk)

        output_serializer = ExchangeProposalSerializer(
            proposal, context={'request': request}
        )
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        proposal = self.get_object()
        if proposal.receiver != request.user:
            return Response(
                {"detail": "Solo el dueño del producto solicitado puede aceptar esta propuesta."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if proposal.status != 'pendiente':
            return Response(
                {"detail": f"No se puede aceptar una propuesta con estado '{proposal.get_status_display()}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not proposal.offered_product.available:
            return Response(
                {"detail": "El producto ofrecido ya no está disponible."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not proposal.requested_product.available:
            return Response(
                {"detail": "El producto solicitado ya no está disponible."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        proposal.status = 'aceptada'
        proposal.save()
        proposal.offered_product.available = False
        proposal.offered_product.save()
        proposal.requested_product.available = False
        proposal.requested_product.save()
        related_ids = set()
        for p in ExchangeProposal.objects.filter(status='pendiente').exclude(pk=proposal.pk):
            if (p.offered_product_id in (proposal.offered_product_id, proposal.requested_product_id) or
                    p.requested_product_id in (proposal.offered_product_id, proposal.requested_product_id)):
                related_ids.add(p.pk)

        if related_ids:
            ExchangeProposal.objects.filter(pk__in=related_ids).update(status='rechazada')

        logger.info(
            "Propuesta #%d aceptada por %s",
            proposal.pk,
            request.user.email,
        )

        serializer = self.get_serializer(proposal)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        proposal = self.get_object()

        if proposal.receiver != request.user:
            return Response(
                {"detail": "Solo el dueño del producto solicitado puede rechazar esta propuesta."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if proposal.status != 'pendiente':
            return Response(
                {"detail": f"No se puede rechazar una propuesta con estado '{proposal.get_status_display()}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        proposal.status = 'rechazada'
        proposal.save()

        logger.info(
            "Propuesta #%d rechazada por %s",
            proposal.pk,
            request.user.email,
        )

        serializer = self.get_serializer(proposal)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        proposal = self.get_object()

        if proposal.proposer != request.user:
            return Response(
                {"detail": "Solo el proponente puede cancelar esta propuesta."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if proposal.status != 'pendiente':
            return Response(
                {"detail": f"No se puede cancelar una propuesta con estado '{proposal.get_status_display()}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        proposal.status = 'cancelada'
        proposal.save()

        logger.info(
            "Propuesta #%d cancelada por %s",
            proposal.pk,
            request.user.email,
        )

        serializer = self.get_serializer(proposal)
        return Response(serializer.data)
