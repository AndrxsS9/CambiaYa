from django.test import TestCase
from apps.users.models import User
from apps.products.models import Product
from apps.exchanges.models import ExchangeProposal

class ExchangeProposalModelTest(TestCase):

    def setUp(self):
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

    def test_create_proposal(self):
        proposal = ExchangeProposal.objects.create(
            proposer=self.user_a,
            offered_product=self.product_a,
            requested_product=self.product_b,
        )
        self.assertEqual(proposal.status, 'pendiente')
        self.assertEqual(proposal.proposer, self.user_a)
        self.assertEqual(proposal.receiver, self.user_b)

    def test_str_representation(self):
        proposal = ExchangeProposal.objects.create(
            proposer=self.user_a,
            offered_product=self.product_a,
            requested_product=self.product_b,
        )
        self.assertIn('Laptop', str(proposal))
        self.assertIn('Bicicleta', str(proposal))


