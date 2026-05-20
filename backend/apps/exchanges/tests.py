from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.products.models import Product
from .models import ExchangeProposal

User = get_user_model()


class ExchangeTests(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(email="proposer@test.com", password="pass1234", name="Proposer")
        self.user2 = User.objects.create_user(email="receiver@test.com", password="pass1234", name="Receiver")
        self.user3 = User.objects.create_user(email="other@test.com", password="pass1234", name="Other")

        # Productos
        self.prod_requested = Product.objects.create(
            owner=self.user2,
            title="Libro de Algoritmos",
            description="Buen estado",
            category="books",
            is_available=True
        )
        self.prod_offered = Product.objects.create(
            owner=self.user1,
            title="Calculadora Científica",
            description="Excelente estado",
            category="electronics",
            is_available=True
        )
        self.prod_other = Product.objects.create(
            owner=self.user3,
            title="Balón de Fútbol",
            description="Viejo",
            category="sports",
            is_available=True
        )

        self.list_url = "/api/v1/exchanges/proposals/"
        self.history_url = "/api/v1/exchanges/proposals/history/"

    def test_create_proposal_valid(self):
        """Un usuario puede crear una propuesta válida."""
        self.client.force_authenticate(user=self.user1)
        data = {
            "requested_product": self.prod_requested.id,
            "offered_product": self.prod_offered.id
        }
        response = self.client.post(self.list_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ExchangeProposal.objects.count(), 1)
        
        prop = ExchangeProposal.objects.first()
        self.assertEqual(prop.proposer, self.user1)
        self.assertEqual(prop.receiver, self.user2)
        self.assertEqual(prop.requested_product, self.prod_requested)
        self.assertEqual(prop.offered_product, self.prod_offered)
        self.assertEqual(prop.status, "pending")

    def test_create_proposal_invalid_own_product(self):
        """No se puede proponer intercambio por un producto propio."""
        self.client.force_authenticate(user=self.user2)
        data = {
            "requested_product": self.prod_requested.id,
            "offered_product": self.prod_other.id # User 2 no es dueño de prod_other tampoco, pero pedir su propio producto debe fallar primero
        }
        response = self.client.post(self.list_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_proposal_invalid_not_owner_of_offered(self):
        """No se puede ofrecer un producto que no le pertenece al proponente."""
        self.client.force_authenticate(user=self.user1)
        data = {
            "requested_product": self.prod_requested.id,
            "offered_product": self.prod_other.id # Pertenece a User 3
        }
        response = self.client.post(self.list_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_accept_proposal_integrity(self):
        """Aceptar una propuesta marca productos como no disponibles y cancela conflictos."""
        # Crear propuesta principal
        prop1 = ExchangeProposal.objects.create(
            proposer=self.user1,
            receiver=self.user2,
            requested_product=self.prod_requested,
            offered_product=self.prod_offered,
            status="pending"
        )
        # Crear propuesta conflictiva (User 3 también quiere el mismo producto)
        prop2 = ExchangeProposal.objects.create(
            proposer=self.user3,
            receiver=self.user2,
            requested_product=self.prod_requested,
            offered_product=self.prod_other,
            status="pending"
        )

        self.client.force_authenticate(user=self.user2) # El receptor acepta
        accept_url = f"{self.list_url}{prop1.id}/accept/"
        response = self.client.patch(accept_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        prop1.refresh_from_db()
        prop2.refresh_from_db()
        self.prod_requested.refresh_from_db()
        self.prod_offered.refresh_from_db()
        self.prod_other.refresh_from_db()

        self.assertEqual(prop1.status, "accepted")
        self.assertEqual(prop2.status, "cancelled") # Cancelado por conflicto
        self.assertFalse(self.prod_requested.is_available)
        self.assertFalse(self.prod_offered.is_available)
        self.assertTrue(self.prod_other.is_available) # No se vio afectado, sigue disponible

    def test_accept_proposal_unauthorized(self):
        """Solo el receptor puede aceptar la propuesta."""
        prop = ExchangeProposal.objects.create(
            proposer=self.user1,
            receiver=self.user2,
            requested_product=self.prod_requested,
            offered_product=self.prod_offered,
            status="pending"
        )
        self.client.force_authenticate(user=self.user1) # Proponente intenta aceptar
        accept_url = f"{self.list_url}{prop.id}/accept/"
        response = self.client.patch(accept_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_reject_proposal(self):
        """El receptor puede rechazar la propuesta."""
        prop = ExchangeProposal.objects.create(
            proposer=self.user1,
            receiver=self.user2,
            requested_product=self.prod_requested,
            status="pending"
        )
        self.client.force_authenticate(user=self.user2)
        reject_url = f"{self.list_url}{prop.id}/reject/"
        response = self.client.patch(reject_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        prop.refresh_from_db()
        self.assertEqual(prop.status, "rejected")

    def test_cancel_proposal(self):
        """El proponente puede cancelar la propuesta."""
        prop = ExchangeProposal.objects.create(
            proposer=self.user1,
            receiver=self.user2,
            requested_product=self.prod_requested,
            status="pending"
        )
        self.client.force_authenticate(user=self.user1)
        cancel_url = f"{self.list_url}{prop.id}/cancel/"
        response = self.client.patch(cancel_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        prop.refresh_from_db()
        self.assertEqual(prop.status, "cancelled")

    def test_exchange_history(self):
        """El historial muestra propuestas no pendientes."""
        ExchangeProposal.objects.create(
            proposer=self.user1, receiver=self.user2, requested_product=self.prod_requested, status="pending"
        )
        ExchangeProposal.objects.create(
            proposer=self.user1, receiver=self.user2, requested_product=self.prod_requested, status="accepted"
        )
        ExchangeProposal.objects.create(
            proposer=self.user1, receiver=self.user2, requested_product=self.prod_requested, status="rejected"
        )

        self.client.force_authenticate(user=self.user1)
        response = self.client.get(self.history_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Solo debe listar las 2 propuestas cerradas (accepted y rejected)
        self.assertEqual(len(response.data), 2)
        self.assertNotIn("pending", [p["status"] for p in response.data])
