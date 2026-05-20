from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.users.models import User
from apps.products.models import Product
from apps.exchanges.models import ExchangeProposal

class ExchangeProposalAPITest(TestCase):

    def setUp(self):
        self.client = APIClient()

        self.user_a = User.objects.create_user(
            username='user_a',
            email='usera@test.com',
            password='TestPass123!',
        )
        self.user_b = User.objects.create_user(
            username='user_b',
            email='userb@test.com',
            password='TestPass123!',
        )

        self.product_a = Product.objects.create(
            title='Laptop',
            description='Laptop gaming',
            category='Electrónica',
            owner=self.user_a,
        )
        self.product_b = Product.objects.create(
            title='Bicicleta',
            description='Bicicleta de montaña',
            category='Deportes',
            owner=self.user_b,
        )
        self.product_c = Product.objects.create(
            title='Libro Python',
            description='Libro de programación',
            category='Libros',
            owner=self.user_a,
        )

    def test_create_proposal_success(self):
        self.client.force_authenticate(user=self.user_a)
        response = self.client.post('/api/v1/exchanges/', {
            'offered_product': self.product_a.id,
            'requested_product': self.product_b.id,
            'message': 'Me interesa tu bicicleta',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'pendiente')
        self.assertEqual(ExchangeProposal.objects.count(), 1)

    def test_create_proposal_unauthenticated(self):
        response = self.client.post('/api/v1/exchanges/', {
            'offered_product': self.product_a.id,
            'requested_product': self.product_b.id,
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_cannot_propose_own_products(self):
        self.client.force_authenticate(user=self.user_a)
        response = self.client.post('/api/v1/exchanges/', {
            'offered_product': self.product_a.id,
            'requested_product': self.product_c.id,  # También de user_a
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_offer_others_product(self):
        self.client.force_authenticate(user=self.user_a)
        response = self.client.post('/api/v1/exchanges/', {
            'offered_product': self.product_b.id,  # De user_b
            'requested_product': self.product_a.id,
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_propose_unavailable_product(self):
        self.product_a.available = False
        self.product_a.save()

        self.client.force_authenticate(user=self.user_a)
        response = self.client.post('/api/v1/exchanges/', {
            'offered_product': self.product_a.id,
            'requested_product': self.product_b.id,
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_create_duplicate_pending_proposal(self):
        self.client.force_authenticate(user=self.user_a)
        self.client.post('/api/v1/exchanges/', {
            'offered_product': self.product_a.id,
            'requested_product': self.product_b.id,
        })
        response = self.client.post('/api/v1/exchanges/', {
            'offered_product': self.product_a.id,
            'requested_product': self.product_b.id,
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_accept_proposal(self):
        proposal = ExchangeProposal.objects.create(
            proposer=self.user_a,
            offered_product=self.product_a,
            requested_product=self.product_b,
        )
        self.client.force_authenticate(user=self.user_b)
        response = self.client.post(f'/api/v1/exchanges/{proposal.id}/accept/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'aceptada')
        self.product_a.refresh_from_db()
        self.product_b.refresh_from_db()
        self.assertFalse(self.product_a.available)
        self.assertFalse(self.product_b.available)

    def test_accept_rejects_other_pending(self):
        proposal_1 = ExchangeProposal.objects.create(
            proposer=self.user_a,
            offered_product=self.product_a,
            requested_product=self.product_b,
        )
        proposal_2 = ExchangeProposal.objects.create(
            proposer=self.user_a,
            offered_product=self.product_c,
            requested_product=self.product_b,
        )

        self.client.force_authenticate(user=self.user_b)
        self.client.post(f'/api/v1/exchanges/{proposal_1.id}/accept/')

        proposal_2.refresh_from_db()
        self.assertEqual(proposal_2.status, 'rechazada')

    def test_reject_proposal(self):
        proposal = ExchangeProposal.objects.create(
            proposer=self.user_a,
            offered_product=self.product_a,
            requested_product=self.product_b,
        )
        self.client.force_authenticate(user=self.user_b)
        response = self.client.post(f'/api/v1/exchanges/{proposal.id}/reject/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'rechazada')

    def test_cancel_proposal(self):
        proposal = ExchangeProposal.objects.create(
            proposer=self.user_a,
            offered_product=self.product_a,
            requested_product=self.product_b,
        )
        self.client.force_authenticate(user=self.user_a)
        response = self.client.post(f'/api/v1/exchanges/{proposal.id}/cancel/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'cancelada')

    def test_only_receiver_can_accept(self):
        proposal = ExchangeProposal.objects.create(
            proposer=self.user_a,
            offered_product=self.product_a,
            requested_product=self.product_b,
        )
        self.client.force_authenticate(user=self.user_a)
        response = self.client.post(f'/api/v1/exchanges/{proposal.id}/accept/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_only_proposer_can_cancel(self):
        proposal = ExchangeProposal.objects.create(
            proposer=self.user_a,
            offered_product=self.product_a,
            requested_product=self.product_b,
        )
        self.client.force_authenticate(user=self.user_b)
        response = self.client.post(f'/api/v1/exchanges/{proposal.id}/cancel/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_cannot_accept_non_pending(self):
        proposal = ExchangeProposal.objects.create(
            proposer=self.user_a,
            offered_product=self.product_a,
            requested_product=self.product_b,
            status='rechazada',
        )
        self.client.force_authenticate(user=self.user_b)
        response = self.client.post(f'/api/v1/exchanges/{proposal.id}/accept/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_proposals(self):
        ExchangeProposal.objects.create(
            proposer=self.user_a,
            offered_product=self.product_a,
            requested_product=self.product_b,
        )
        self.client.force_authenticate(user=self.user_a)
        response = self.client.get('/api/v1/exchanges/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_filter_sent_proposals(self):
        ExchangeProposal.objects.create(
            proposer=self.user_a,
            offered_product=self.product_a,
            requested_product=self.product_b,
        )
        self.client.force_authenticate(user=self.user_a)
        response = self.client.get('/api/v1/exchanges/?type=sent')
        self.assertEqual(len(response.data), 1)

        self.client.force_authenticate(user=self.user_b)
        response = self.client.get('/api/v1/exchanges/?type=sent')
        self.assertEqual(len(response.data), 0)

    def test_filter_received_proposals(self):
        ExchangeProposal.objects.create(
            proposer=self.user_a,
            offered_product=self.product_a,
            requested_product=self.product_b,
        )
        self.client.force_authenticate(user=self.user_b)
        response = self.client.get('/api/v1/exchanges/?type=received')
        self.assertEqual(len(response.data), 1)
