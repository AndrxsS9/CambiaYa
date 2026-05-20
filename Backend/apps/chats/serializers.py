from rest_framework import serializers
from apps.users.models import CustomUser
from .models import Message


class UserChatSerializer(serializers.ModelSerializer):
    """
    Serializer simplificado de usuario para adjuntar a los chats y conversaciones.
    """
    profile_picture_url = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ["id", "name", "email", "profile_picture_url"]

    def get_profile_picture_url(self, obj):
        if obj.profile_picture:
            return obj.profile_picture.url
        return None


class MessageSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Message.
    """
    sender_details = UserChatSerializer(source="sender", read_only=True)
    recipient_details = UserChatSerializer(source="recipient", read_only=True)

    class Meta:
        model = Message
        fields = [
            "id",
            "sender",
            "sender_details",
            "recipient",
            "recipient_details",
            "content",
            "timestamp",
            "is_read",
        ]
        read_only_fields = ["id", "sender", "timestamp", "is_read"]
