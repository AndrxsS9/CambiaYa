import logging
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .validators import StrongPasswordValidator
from .models import PrivacyConsent

User = get_user_model()
logger = logging.getLogger(__name__)


class StrongPasswordValidatorTests(TestCase):
    """Cifrado de contraseñas — validación de fortaleza."""

    def setUp(self):
        self.validator = StrongPasswordValidator()

    def test_strong_password_passes(self):
        """Contraseña con mayúscula, minúscula, número y especial pasa."""
        self.validator.validate("SecurePass123!")

    def test_no_uppercase_fails(self):
        """Contraseña sin mayúscula es rechazada."""
        with self.assertRaises(ValidationError):
            self.validator.validate("securepass123!")

    def test_no_lowercase_fails(self):
        """Contraseña sin minúscula es rechazada."""
        with self.assertRaises(ValidationError):
            self.validator.validate("SECUREPASS123!")

    def test_no_number_fails(self):
        """Contraseña sin número es rechazada."""
        with self.assertRaises(ValidationError):
            self.validator.validate("SecurePass!")

    def test_no_special_char_fails(self):
        """Contraseña sin carácter especial es rechazada."""
        with self.assertRaises(ValidationError):
            self.validator.validate("SecurePass123")

    def test_password_is_hashed_not_plaintext(self):
        """La contraseña se almacena como hash, nunca en texto plano."""
        user = User.objects.create_user(email="hash@test.com", password="SecurePass123!", name="Test")
        self.assertNotEqual(user.password, "SecurePass123!")
        self.assertTrue(user.check_password("SecurePass123!"))


class SecurityHeadersTests(TestCase):
    """Protección de datos sensibles — headers HTTP."""

    def test_headers_present_on_api_response(self):
        """Las cabeceras de seguridad están presentes en respuestas de API."""
        response = self.client.get("/api/v1/security/privacy-policy/")
        self.assertEqual(response["X-Content-Type-Options"], "nosniff")
        self.assertEqual(response["X-Frame-Options"], "DENY")
        self.assertEqual(response["X-XSS-Protection"], "1; mode=block")
        self.assertIn("no-store", response.get("Cache-Control", ""))


class PrivacyPolicyTests(TestCase):
    """Tarea 5: Política de tratamiento de datos personales."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="privacy@test.com", password="SecurePass123!", name="Test",
        )

    def test_privacy_policy_is_public(self):
        """La política de privacidad es accesible sin autenticación."""
        response = self.client.get("/api/v1/security/privacy-policy/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("sections", response.data)

    def test_accept_privacy_requires_auth(self):
        """Aceptar consentimiento requiere autenticación."""
        response = self.client.post("/api/v1/security/accept-privacy/", {
            "accepted_privacy_policy": True,
            "accepted_data_treatment": True,
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_accept_privacy_authenticated(self):
        """Usuario autenticado puede registrar consentimiento."""
        self.client.force_authenticate(user=self.user)
        response = self.client.post("/api/v1/security/accept-privacy/", {
            "accepted_privacy_policy": True,
            "accepted_data_treatment": True,
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(PrivacyConsent.objects.filter(user=self.user).exists())

    def test_my_consent_no_consent(self):
        """Sin consentimiento previo retorna has_consent=False."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/v1/security/my-consent/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["has_consent"])

    def test_my_consent_after_accepting(self):
        """Después de aceptar retorna has_consent=True."""
        self.client.force_authenticate(user=self.user)
        self.client.post("/api/v1/security/accept-privacy/", {
            "accepted_privacy_policy": True,
            "accepted_data_treatment": True,
        })
        response = self.client.get("/api/v1/security/my-consent/")
        self.assertTrue(response.data["has_consent"])
