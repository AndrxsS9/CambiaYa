from datetime import timedelta

from django.test import TestCase
from django.urls import reverse
from django.utils.timezone import now

from apps.security.models import AccountLockout, LoginAttempt
from apps.users.models import User


class AccountLockoutTests(TestCase):

    def setUp(self):
        self.email = 'test@example.com'
        self.password = 'TestPassword123!'
        self.user = User.objects.create_user(
            username='testuser',
            email=self.email,
            password=self.password,
        )
        self.login_url = reverse('token_obtain_pair')

    def _attempt_login(self, password='wrong_password'):
        return self.client.post(
            self.login_url,
            {'email': self.email, 'password': password},
            content_type='application/json',
        )

    def test_lockout_after_five_failed_attempts(self):
        for _ in range(5):
            self._attempt_login()

        response = self._attempt_login()
        self.assertEqual(response.status_code, 429)

    def test_lockout_message_includes_minutes(self):
        for _ in range(5):
            self._attempt_login()

        response = self._attempt_login()
        self.assertIn('minutos', response.json()['detail'])

    def test_successful_login_clears_lockout(self):
        AccountLockout.objects.create(
            email=self.email,
            locked_until=now() - timedelta(minutes=1),
            attempt_count=5,
        )

        response = self._attempt_login(password=self.password)
        self.assertEqual(response.status_code, 200)
        self.assertFalse(AccountLockout.objects.filter(email=self.email).exists())

    def test_lockout_resets_after_window(self):
        AccountLockout.objects.create(
            email=self.email,
            locked_until=now() - timedelta(minutes=1),
            attempt_count=5,
        )

        response = self._attempt_login()
        self.assertEqual(response.status_code, 401)

    def test_login_attempt_is_recorded(self):
        self._attempt_login()
        self.assertEqual(LoginAttempt.objects.filter(email=self.email).count(), 1)

    def test_successful_login_records_attempt(self):
        self._attempt_login(password=self.password)
        attempt = LoginAttempt.objects.filter(email=self.email).first()
        self.assertIsNotNone(attempt)
        self.assertTrue(attempt.successful)
