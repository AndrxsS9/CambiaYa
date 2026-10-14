import logging
from django.db.models import Q
from django.contrib.auth import get_user_model
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Message
from .serializers import MessageSerializer, UserChatSerializer

logger = logging.getLogger(__name__)
User = get_user_model()


class MessageViewSet(viewsets.ModelViewSet):
    """
    ViewSet para mensajería interna.
    Permite enviar, recibir y listar conversaciones de chat.
    """
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Message.objects.all()

    def get_queryset(self):
        """
        Retorna la conversación entre el usuario autenticado y otro usuario (parámetro 'recipient').
        """
        queryset = super().get_queryset()
        recipient_id = self.request.query_params.get("recipient")
        if recipient_id:
            # Mensajes donde (yo soy remitente y él destinatario) O (él es remitente y yo destinatario)
            queryset = queryset.filter(
                (Q(sender=self.request.user) & Q(recipient_id=recipient_id)) |
                (Q(sender_id=recipient_id) & Q(recipient=self.request.user))
            ).order_by("timestamp")
            return queryset
        
        # Por defecto retorna todos los mensajes donde participa el usuario
        return queryset.filter(Q(sender=self.request.user) | Q(recipient=self.request.user))

    def perform_create(self, serializer):
        """Asigna al usuario autenticado como remitente (sender)."""
        message = serializer.save(sender=self.request.user)
        logger.info(
            "Mensaje chat enviado por %s a %s",
            self.request.user.email,
            message.recipient.email,
        )

    @action(detail=False, methods=["get"])
    def conversations(self, request):
        """
        GET /api/v1/chats/messages/conversations/
        Retorna la lista de conversaciones del usuario autenticado.
        Agrupa por participante, incluyendo el último mensaje y contador de no leídos.
        """
        current_user = request.user
        
        # Buscar todos los mensajes donde participa el usuario
        all_messages = Message.objects.filter(
            Q(sender=current_user) | Q(recipient=current_user)
        )
        
        # Obtener los IDs únicos de los participantes con los que ha chateado
        participant_ids = set()
        for msg in all_messages:
            if msg.sender_id != current_user.id:
                participant_ids.add(msg.sender_id)
            if msg.recipient_id != current_user.id:
                participant_ids.add(msg.recipient_id)

        participants = User.objects.filter(id__in=participant_ids)
        conversations = []

        for participant in participants:
            # Obtener el último mensaje de la conversación
            last_msg = Message.objects.filter(
                (Q(sender=current_user) & Q(recipient=participant)) |
                (Q(sender=participant) & Q(recipient=current_user))
            ).order_by("-timestamp").first()

            # Contar mensajes no leídos enviados por este participante a mí
            unread_count = Message.objects.filter(
                sender=participant,
                recipient=current_user,
                is_read=False
            ).count()

            conversations.append({
                "participant": UserChatSerializer(participant).data,
                "last_message": {
                    "content": last_msg.content if last_msg else "",
                    "timestamp": last_msg.timestamp if last_msg else None,
                    "sender_id": last_msg.sender_id if last_msg else None
                },
                "unread_count": unread_count
            })

        # Ordenar conversaciones por la fecha del último mensaje
        conversations.sort(
            key=lambda x: x["last_message"]["timestamp"] if x["last_message"]["timestamp"] else current_user.date_joined,
            reverse=True
        )

        return Response(conversations, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"])
    def mark_read(self, request):
        """
        POST /api/v1/chats/messages/mark_read/
        Marca como leídos todos los mensajes recibidos de un remitente específico ('sender').
        """
        sender_id = request.data.get("sender") or request.query_params.get("sender")
        if not sender_id:
            return Response(
                {"error": "El ID del remitente ('sender') es obligatorio."},
                status=status.HTTP_400_BAD_REQUEST
            )

        messages = Message.objects.filter(
            sender_id=sender_id,
            recipient=request.user,
            is_read=False
        )
        count = messages.count()
        messages.update(is_read=True)
        
        logger.info(
            "Marcados como leídos %d mensajes enviados por el usuario %s a %s",
            count,
            sender_id,
            request.user.email
        )
        return Response({"marked_read_count": count}, status=status.HTTP_200_OK)
