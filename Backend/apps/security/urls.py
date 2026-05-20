from django.urls import path
from . import views

urlpatterns = [
    # GET — Política de tratamiento de datos (pública)
    path("privacy-policy/", views.privacy_policy_view, name="security-privacy-policy"),
    # POST — Registrar consentimiento (requiere auth)
    path("accept-privacy/", views.accept_privacy_view, name="security-accept-privacy"),
    # GET — Estado de consentimiento del usuario (requiere auth)
    path("my-consent/", views.my_consent_view, name="security-my-consent"),
]
