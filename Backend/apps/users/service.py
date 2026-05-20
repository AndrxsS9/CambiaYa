from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()

class UserService:
    @staticmethod
    def create_user(data):
        user = User.objects.create_user(
            username=data['username'],
            email=data['email'],
            password=data['password']
        )
        return user
    
class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def create(self, validated_data):
        return UserService.create_user(validated_data)