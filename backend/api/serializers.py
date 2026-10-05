from rest_framework import serializers
from .models import Claim
from django.contrib.auth.models import User


class ClaimSerializer(serializers.ModelSerializer):
    class Meta:
        model = Claim
        fields = [
            'id',
            'claim_text',
            'verdict',
            'confidence',
            'explanation',
            'source_url',
            'created_at'
        ]
        read_only_fields = [
            'id',
            'verdict',
            'confidence',
            'explanation',
            'source_url',
            'created_at'
        ]
        from django.contrib.auth.models import User


class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'password']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user