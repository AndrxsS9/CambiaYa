"""
CambiaYa — Locust load test scenario
Simulates a realistic mix of user actions:
  - Login (CPU-bound: PBKDF2 hash)
  - List products (I/O + serialization, no pagination)
  - Get product detail
  - List exchanges
  - List chat conversations (N+1 query — observable under load)
  - Send a chat message

Run:
    pip install locust
    locust -f locustfile.py --host http://localhost:8000

Then open http://localhost:8089 and set:
  - Number of users: 50
  - Spawn rate: 5 per second
  - Run for at least 10 minutes
  - Discard the first 60 seconds (warm-up)
"""
import random
from locust import HttpUser, task, between, events

# Credentials created by seed_load
USERS = [{"email": f"loaduser{i:04d}@cambiatest.co", "password": "testpass123"} for i in range(50)]

@events.quitting.add_listener
def on_quitting(environment, **kwargs):
    print("\nTest finished. Check Locust stats for p50 / p95 / p99 latencies.")


class CambiaYaUser(HttpUser):
    wait_time = between(0.5, 2.0)
    token = None
    my_product_id = None

    def on_start(self):
        """Login and cache the JWT token."""
        creds = random.choice(USERS)
        with self.client.post(
            "/api/v1/auth/login/",
            json={"email": creds["email"], "password": creds["password"]},
            catch_response=True,
            name="POST /auth/login",
        ) as resp:
            if resp.status_code == 200:
                data = resp.json()
                self.token = data.get("access") or data.get("access_token")
                resp.success()
            else:
                resp.failure(f"Login failed: {resp.status_code} — {resp.text[:200]}")

    def auth_headers(self):
        return {"Authorization": f"Bearer {self.token}"} if self.token else {}

    @task(5)
    def list_products(self):
        """Most common action. No pagination — serializes all rows."""
        self.client.get(
            "/api/v1/products/",
            headers=self.auth_headers(),
            name="GET /products/",
        )

    @task(3)
    def get_product_detail(self):
        """Fetch a single product by a random ID (1–500 range)."""
        product_id = random.randint(1, 500)
        with self.client.get(
            f"/api/v1/products/{product_id}/",
            headers=self.auth_headers(),
            catch_response=True,
            name="GET /products/:id",
        ) as resp:
            if resp.status_code in (200, 404):
                resp.success()
            else:
                resp.failure(f"Unexpected status: {resp.status_code}")

    @task(3)
    def list_exchanges(self):
        """List the user's exchange proposals."""
        self.client.get(
            "/api/v1/exchanges/",
            headers=self.auth_headers(),
            name="GET /exchanges/",
        )

    @task(4)
    def list_conversations(self):
        """
        This endpoint has an N+1 query: it iterates over all messages in Python
        and fires 2 DB queries per conversation partner.
        Under load, this is the most interesting endpoint to profile.
        """
        self.client.get(
            "/api/v1/chats/messages/conversations/",
            headers=self.auth_headers(),
            name="GET /chats/conversations (N+1)",
        )

    @task(2)
    def get_chat_messages(self):
        """Fetch messages with a random recipient."""
        recipient_id = random.randint(1, 50)
        self.client.get(
            f"/api/v1/chats/messages/?recipient={recipient_id}",
            headers=self.auth_headers(),
            name="GET /chats/messages?recipient=",
        )

    @task(1)
    def send_message(self):
        """Send a chat message (write operation)."""
        recipient_id = random.randint(1, 50)
        self.client.post(
            "/api/v1/chats/messages/",
            json={"recipient": recipient_id, "content": "Hola, ¿te interesa intercambiar?"},
            headers=self.auth_headers(),
            name="POST /chats/messages",
        )
