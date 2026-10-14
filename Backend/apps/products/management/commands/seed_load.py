"""
Management command: seed_load
Creates realistic load-test data:
  - 50 users
  - 500 products (10 per user)
  - 2 000 exchange proposals
  - 10 000 chat messages

Safe to re-run: skips creation if data already exists.
Usage:
    python manage.py seed_load
    python manage.py seed_load --users 100 --products 20 --messages 20000
"""
import random
import logging
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.products.models import Product
from apps.exchanges.models import ExchangeProposal
from apps.chats.models import Message

logger = logging.getLogger(__name__)
User = get_user_model()

CATEGORIES = ['Electrónica', 'Ropa', 'Libros', 'Deportes', 'Hogar', 'Otro']

PRODUCT_TITLES = [
    "Laptop Dell i5", "Mochila Totto", "Libro Clean Code", "Balón de fútbol",
    "Silla ergonómica", "Monitor 24''", "Teclado mecánico", "Mouse inalámbrico",
    "Auriculares Sony", "Cargador USB-C", "Chaqueta invierno", "Jeans slim fit",
    "Zapatos deportivos", "Camiseta universitaria", "Sudadera con capucha",
    "Cafetera Oster", "Licuadora Oster", "Plancha de ropa", "Termo Stanley",
    "Mochila porta laptop",
]


class Command(BaseCommand):
    help = "Carga datos masivos para pruebas de carga (load testing)"

    def add_arguments(self, parser):
        parser.add_argument('--users', type=int, default=50)
        parser.add_argument('--products', type=int, default=10)
        parser.add_argument('--proposals', type=int, default=2000)
        parser.add_argument('--messages', type=int, default=10000)

    def handle(self, *args, **options):
        n_users = options['users']
        n_products_per_user = options['products']
        n_proposals = options['proposals']
        n_messages = options['messages']

        # --- Users ---
        existing = User.objects.filter(email__startswith="loaduser").count()
        if existing >= n_users:
            self.stdout.write(f"Already have {existing} load users — skipping user creation.")
            users = list(User.objects.filter(email__startswith="loaduser")[:n_users])
        else:
            self.stdout.write(f"Creating {n_users} users...")
            users = []
            for i in range(n_users):
                email = f"loaduser{i:04d}@cambiatest.co"
                u, created = User.objects.get_or_create(
                    email=email,
                    defaults={
                        "name": f"Load User {i:04d}",
                        "bio": "Cuenta de prueba de carga.",
                        "location": "Pasto, Nariño",
                    }
                )
                if created:
                    u.set_password("testpass123")
                    u.save()
                users.append(u)
            self.stdout.write(self.style.SUCCESS(f"  {len(users)} users ready."))

        # --- Products ---
        existing_products = Product.objects.filter(owner__in=users).count()
        expected_products = n_users * n_products_per_user
        if existing_products >= expected_products:
            self.stdout.write(f"Already have {existing_products} load products — skipping product creation.")
            products = list(Product.objects.filter(owner__in=users))
        else:
            self.stdout.write(f"Creating {expected_products} products...")
            products = []
            to_create = []
            for user in users:
                for j in range(n_products_per_user):
                    title = random.choice(PRODUCT_TITLES) + f" #{user.pk}-{j}"
                    to_create.append(Product(
                        title=title,
                        description=f"Producto de prueba de carga. Índice {j} del usuario {user.email}.",
                        category=random.choice(CATEGORIES),
                        estimated_value=random.randint(10000, 500000),
                        owner=user,
                        available=True,
                    ))
            products = Product.objects.bulk_create(to_create, batch_size=500)
            products = list(Product.objects.filter(owner__in=users))
            self.stdout.write(self.style.SUCCESS(f"  {len(products)} products ready."))

        # --- Exchange Proposals ---
        existing_proposals = ExchangeProposal.objects.filter(proposer__in=users).count()
        if existing_proposals >= n_proposals:
            self.stdout.write(f"Already have {existing_proposals} proposals — skipping.")
        else:
            self.stdout.write(f"Creating {n_proposals} exchange proposals...")
            proposals_to_create = []
            seen_pairs = set()
            attempts = 0
            while len(proposals_to_create) < n_proposals and attempts < n_proposals * 5:
                attempts += 1
                proposer = random.choice(users)
                offered = random.choice([p for p in products if p.owner == proposer] or products)
                receiver_products = [p for p in products if p.owner != proposer]
                if not receiver_products:
                    continue
                requested = random.choice(receiver_products)
                pair = (offered.pk, requested.pk)
                if pair in seen_pairs:
                    continue
                seen_pairs.add(pair)
                proposals_to_create.append(ExchangeProposal(
                    proposer=proposer,
                    offered_product=offered,
                    requested_product=requested,
                    status=random.choice(['pendiente', 'aceptada', 'rechazada']),
                    message="Propuesta de prueba de carga.",
                ))
            ExchangeProposal.objects.bulk_create(proposals_to_create, batch_size=500, ignore_conflicts=True)
            self.stdout.write(self.style.SUCCESS(f"  {len(proposals_to_create)} proposals ready."))

        # --- Chat Messages ---
        existing_messages = Message.objects.filter(sender__in=users).count()
        if existing_messages >= n_messages:
            self.stdout.write(f"Already have {existing_messages} messages — skipping.")
        else:
            self.stdout.write(f"Creating {n_messages} chat messages...")
            messages_to_create = []
            for _ in range(n_messages):
                sender = random.choice(users)
                recipient = random.choice([u for u in users if u != sender])
                messages_to_create.append(Message(
                    sender=sender,
                    recipient=recipient,
                    content=f"Mensaje de prueba de carga #{random.randint(1, 999999)}. ¿Te interesa intercambiar?",
                    is_read=random.choice([True, False]),
                ))
            Message.objects.bulk_create(messages_to_create, batch_size=1000)
            self.stdout.write(self.style.SUCCESS(f"  {n_messages} messages ready."))

        self.stdout.write(self.style.SUCCESS("\nSeed load complete. The database is ready for load testing."))
