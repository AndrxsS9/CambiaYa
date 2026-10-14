from rest_framework import serializers

from apps.products.serializers import ProductSerializer
from .models import ExchangeProposal


class ExchangeProposalSerializer(serializers.ModelSerializer):

    offered_product_detail = ProductSerializer(source='offered_product', read_only=True)
    requested_product_detail = ProductSerializer(source='requested_product', read_only=True)
    proposer_name = serializers.SerializerMethodField()
    receiver_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = ExchangeProposal
        fields = [
            'id', 'proposer', 'proposer_name', 'receiver_name',
            'offered_product', 'offered_product_detail',
            'requested_product', 'requested_product_detail',
            'status', 'status_display', 'message',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'proposer', 'status',
            'created_at', 'updated_at',
        ]

    def get_proposer_name(self, obj):
        return obj.proposer.get_full_name() or obj.proposer.email

    def get_receiver_name(self, obj):
        receiver = obj.receiver
        return receiver.get_full_name() or receiver.email


class ExchangeProposalCreateSerializer(serializers.ModelSerializer):

    class Meta:
        model = ExchangeProposal
        fields = [
            'id', 'offered_product', 'requested_product',
            'message', 'status', 'created_at',
        ]
        read_only_fields = ['id', 'status', 'created_at']

    def validate_offered_product(self, value):
        user = self.context['request'].user
        if value.owner != user:
            raise serializers.ValidationError(
                "Solo puedes ofrecer tus propios productos."
            )
        if not value.available:
            raise serializers.ValidationError(
                "Este producto ya no está disponible para intercambio."
            )
        return value

    def validate_requested_product(self, value):
        user = self.context['request'].user
        if value.owner == user:
            raise serializers.ValidationError(
                "No puedes solicitar un intercambio por tu propio producto."
            )
        if not value.available:
            raise serializers.ValidationError(
                "Este producto ya no está disponible para intercambio."
            )
        return value

    def validate(self, attrs):
        offered = attrs.get('offered_product')
        requested = attrs.get('requested_product')

        if offered and requested and offered == requested:
            raise serializers.ValidationError(
                "El producto ofrecido y el solicitado no pueden ser el mismo."
            )
        if offered and requested:
            existing = ExchangeProposal.objects.filter(
                offered_product=offered,
                requested_product=requested,
                status='pendiente',
            ).exists()
            if existing:
                raise serializers.ValidationError(
                    "Ya existe una propuesta pendiente para esta combinación de productos."
                )

        return attrs
