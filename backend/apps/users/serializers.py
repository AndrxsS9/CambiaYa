from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import User


class RegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True,
        min_length=8,
        error_messages={
            'min_length': 'La contraseña debe tener al menos 8 caracteres.',
        },
    )

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'password']
        extra_kwargs = {
            'username': {'required': False},
            'email': {
                'error_messages': {
                    'unique': 'Este correo electrónico ya está registrado.',
                },
            },
        }

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        user = User(
            email=validated_data['email'],
            username=validated_data.get('username', validated_data['email']),
            first_name=validated_data.get('first_name', ''),
        )
        user.set_password(validated_data['password'])
        user.save()
        return user
