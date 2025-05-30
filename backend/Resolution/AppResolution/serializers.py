from AppResolution.models import User, Authentication, Claim, Request, Profile
from rest_framework import serializers
from django.contrib.auth.hashers import make_password

class user_serializer(serializers.ModelSerializer):
    profile = serializers.PrimaryKeyRelatedField(read_only=True)
    phone = serializers.CharField(max_length=15, required=False, allow_blank=True, allow_null=True)
    username = serializers.CharField(max_length=150, required=False, allow_blank=True, allow_null=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'password', 'phone', 'verified', 'is_admin', 'profile']
        extra_kwargs = {
            'password': {'write_only': True},
            'verified': {'read_only': True}  
        }

    def create(self, validated_data):
        # Handle empty phone field
        if validated_data.get('phone') == '':
            validated_data['phone'] = None
            
        # Set username to email if not provided
        if not validated_data.get('username'):
            validated_data['username'] = validated_data['email']
            
        validated_data['password'] = make_password(validated_data['password'])
        validated_data['verified'] = 0
        return super().create(validated_data)


class authentication_serializer(serializers.ModelSerializer):
    class Meta:
        model = Authentication
        fields = ['id', 'user', 'token']

class claim_serializer(serializers.ModelSerializer):
    class Meta:
        model = Claim
        fields = ['id', 'user', 'subject', 'description', 'status', 'created_at']

class request_serializer(serializers.ModelSerializer):
    class Meta:
        model = Request
        fields = ['id', 'user', 'subject', 'description', 'status', 'created_at']

class profile_serializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['id', 'first_name','last_name','email','password','phone', 'photo']

        
