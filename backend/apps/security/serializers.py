import logging
from rest_framework import serializers
from .models import PrivacyConsent

logger = logging.getLogger(__name__)


class PrivacyConsentSerializer(serializers.ModelSerializer):
    """Serializer para registrar/consultar consentimiento de privacidad."""

    class Meta:
        model = PrivacyConsent
        fields = [
            "id",
            "accepted_privacy_policy",
            "accepted_data_treatment",
            "policy_version",
            "created_at",
        ]
        extra_kwargs = {
            "id": {"read_only": True},
            "policy_version": {"read_only": True},
            "created_at": {"read_only": True},
        }
