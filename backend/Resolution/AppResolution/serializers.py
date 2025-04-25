from AppResolution.models import User, Authentication, Claim, Request, Profile
from rest_framework import serializers
from django.contrib.auth.hashers import make_password

class user_serializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email', 'password', 'phone', 'verified']
        extra_kwargs = {
            'password': {'write_only': True},
            'verified': {'read_only': True}  # Campo manejado solo por el backend
        }

    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])
        validated_data['verified'] = False
        return super().create(validated_data)


class authentication_serializer(serializers.ModelSerializer):
    class Meta:
        model = Authentication
        fields = ['id', 'user', 'token']

class claim_serializer(serializers.ModelSerializer):
    class Meta:
        model = Claim
        fields = ['id', 'user', 'subject', 'description', 'status']

class request_serializer(serializers.ModelSerializer):
    class Meta:
        model = Request
        fields = ['id', 'user', 'subject', 'description', 'status']

class profile_serializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['id', 'first_name','last_name','email','password','phone', 'photo']

        
