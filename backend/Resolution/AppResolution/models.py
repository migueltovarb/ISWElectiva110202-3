from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class User(AbstractUser):
    username = models.CharField(max_length=150, unique=True, null=True, blank=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    email = models.EmailField(max_length=50, unique=True)
    password = models.CharField(max_length=128)
    phone = models.CharField(max_length=15, null=True, blank=True, unique=True)
    verified = models.IntegerField(default=0)
    is_admin = models.BooleanField(default=False)
    profile = models.OneToOneField('Profile', on_delete=models.SET_NULL, null=True, blank=True, related_name='user_profile')

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []


class Authentication(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='authentications')
    token = models.CharField(max_length=10, null=True)


class Claim(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='claims')
    subject = models.CharField(max_length=500, null=True)
    description = models.CharField(max_length=500, null=True)
    status = models.CharField(max_length=255, null=True)
    created_at = models.DateTimeField(auto_now_add=True)


class Request(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='requests')
    subject = models.CharField(max_length=500, null=True)
    description = models.CharField(max_length=500, null=True)
    status = models.CharField(max_length=255, null=True)
    created_at = models.DateTimeField(auto_now_add=True)


class Profile(models.Model):
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    email = models.EmailField(max_length=50)
    password = models.CharField(max_length=128)
    phone = models.CharField(max_length=15, null=True, blank=True)
    photo = models.CharField(max_length=255)