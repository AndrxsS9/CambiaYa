from rest_framework import serializers
from apps.users.serializers import ProfileSerializer
from apps.products.serializers import ProductSerializer
from apps.products.models import Product
from .models import ExchangeProposal


class ExchangeProposalSerializer(serializers.ModelSerializer):
    """
    Serializer para propuestas de intercambio.
    Incluye detalles completos de usuarios y productos en lectura,
    y recibe IDs para creación.
    """
    proposer_details = ProfileSerializer(source="proposer", read_only=True)
    receiver_details = ProfileSerializer(source="receiver", read_only=True)
    requested_product_details = ProductSerializer(source="requested_product", read_only=True)
    offered_product_details = ProductSerializer(source="offered_product", read_only=True)

    class Meta:
        model = ExchangeProposal
        fields = [
            "id",
            "proposer",
            "proposer_details",
            "receiver",
            "receiver_details",
            "requested_product",
            "requested_product_details",
            "offered_product",
            "offered_product_details",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "proposer", "receiver", "status", "created_at", "updated_at"]

    def validate(self, attrs):
        request = self.context.get("request")
        if not request or not request.user:
            raise serializers.ValidationError("Usuario no autenticado.")

        current_user = request.user
        requested_product = attrs.get("requested_product")
        offered_product = attrs.get("offered_product")

        # 1. Validar producto solicitado
        if not requested_product.is_available:
            raise serializers.ValidationError(
                {"requested_product": "El producto solicitado ya no está disponible para intercambio."}
            )

        if requested_product.owner == current_user:
            raise serializers.ValidationError(
                {"requested_product": "No puedes proponer un intercambio por tu propio producto."}
            )

        # 2. Validar producto ofertado (si se provee)
        if offered_product:
            if offered_product.owner != current_user:
                raise serializers.ValidationError(
                    {"offered_product": "El producto ofertado debe ser de tu propiedad."}
                )
            if not offered_product.is_available:
                raise serializers.ValidationError(
                    {"offered_product": "El producto que ofreces debe estar marcado como disponible."}
                )
            if offered_product == requested_product:
                raise serializers.ValidationError(
                    {"offered_product": "No puedes ofrecer el mismo producto que solicitas."}
                )

        return attrs
