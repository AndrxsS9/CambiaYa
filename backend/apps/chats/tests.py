from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import Message

User = get_user_model()


class ChatTests(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(email="user1@test.com", password="pass1234", name="User One")
        self.user2 = User.objects.create_user(email="user2@test.com", password="pass1234", name="User Two")
        self.user3 = User.objects.create_user(email="user3@test.com", password="pass1234", name="User Three")

        self.messages_url = "/api/v1/chats/messages/"
        self.conversations_url = "/api/v1/chats/messages/conversations/"
        self.mark_read_url = "/api/v1/chats/messages/mark_read/"

    def test_send_message_authenticated(self):
        """Un usuario autenticado puede enviar un mensaje."""
        self.client.force_authenticate(user=self.user1)
        data = {"recipient": self.user2.id, "content": "Hola User 2"}
        response = self.client.post(self.messages_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Message.objects.count(), 1)
        
        msg = Message.objects.first()
        self.assertEqual(msg.sender, self.user1)
        self.assertEqual(msg.recipient, self.user2)
        self.assertEqual(msg.content, "Hola User 2")
        self.assertFalse(msg.is_read)

    def test_send_message_anonymous(self):
        """Un usuario no autenticado no puede enviar mensajes."""
        data = {"recipient": self.user2.id, "content": "Hola"}
        response = self.client.post(self.messages_url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_messages_between_users(self):
        """Retorna solo la conversación entre el usuario autenticado y el destinatario especificado."""
        # Mensajes entre User 1 y User 2
        Message.objects.create(sender=self.user1, recipient=self.user2, content="Mensaje 1")
        Message.objects.create(sender=self.user2, recipient=self.user1, content="Mensaje 2")
        # Mensaje de User 1 a User 3 (fuera de conversación)
        Message.objects.create(sender=self.user1, recipient=self.user3, content="Mensaje 3")

        self.client.force_authenticate(user=self.user1)
        
        # Consultar mensajes con User 2
        response = self.client.get(f"{self.messages_url}?recipient={self.user2.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Debe retornar 2 mensajes en orden cronológico
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]["content"], "Mensaje 1")
        self.assertEqual(response.data[1]["content"], "Mensaje 2")

    def test_list_conversations(self):
        """Retorna las conversaciones activas con su último mensaje y mensajes no leídos."""
        # User 2 envía mensaje a User 1 (no leído)
        Message.objects.create(sender=self.user2, recipient=self.user1, content="Hola de User 2")
        # User 1 envía a User 3 (leído, aunque is_read es false por defecto, es enviado por mí así que cuenta como leído para mí)
        Message.objects.create(sender=self.user1, recipient=self.user3, content="Hola a User 3")

        self.client.force_authenticate(user=self.user1)
        response = self.client.get(self.conversations_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 2 conversaciones distintas (User 2 y User 3)
        self.assertEqual(len(response.data), 2)
        
        # Buscar conversación con User 2
        conv_user2 = next(c for c in response.data if c["participant"]["id"] == self.user2.id)
        self.assertEqual(conv_user2["last_message"]["content"], "Hola de User 2")
        self.assertEqual(conv_user2["unread_count"], 1)

        # Buscar conversación con User 3
        conv_user3 = next(c for c in response.data if c["participant"]["id"] == self.user3.id)
        self.assertEqual(conv_user3["last_message"]["content"], "Hola a User 3")
        self.assertEqual(conv_user3["unread_count"], 0)  # Enviado por mí, no cuenta como no leído

    def test_mark_messages_as_read(self):
        """Marca mensajes del remitente como leídos."""
        msg1 = Message.objects.create(sender=self.user2, recipient=self.user1, content="M1", is_read=False)
        msg2 = Message.objects.create(sender=self.user2, recipient=self.user1, content="M2", is_read=False)
        msg3 = Message.objects.create(sender=self.user3, recipient=self.user1, content="M3", is_read=False)

        self.client.force_authenticate(user=self.user1)
        
        # Marcar leídos de User 2
        response = self.client.post(self.mark_read_url, {"sender": self.user2.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["marked_read_count"], 2)

        msg1.refresh_from_db()
        msg2.refresh_from_db()
        msg3.refresh_from_db()

        self.assertTrue(msg1.is_read)
        self.assertTrue(msg2.is_read)
        self.assertFalse(msg3.is_read)  # Sigue sin leer porque es de User 3
