from django.contrib import admin
from .models import PrivacyConsent

@admin.register(PrivacyConsent)
class PrivacyConsentAdmin(admin.ModelAdmin):
    """Panel de administración para consentimientos de privacidad."""
    list_display = ("user", "accepted_privacy_policy", "accepted_data_treatment", "policy_version", "created_at")
    list_filter = ("accepted_privacy_policy", "accepted_data_treatment", "policy_version")
    search_fields = ("user__email",)
    readonly_fields = (
        "user", "accepted_privacy_policy", "accepted_data_treatment",
        "ip_address", "policy_version", "created_at",
    )
    date_hierarchy = "created_at"

    def has_add_permission(self, request):
        """Los consentimientos no se crean manualmente."""
        return False

    def has_change_permission(self, request, obj=None):
        """Los consentimientos son inmutables (trazabilidad legal)."""
        return False
