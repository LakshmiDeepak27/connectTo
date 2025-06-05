from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import random
import string
from datetime import timedelta
from django.contrib.auth.models import User

User = get_user_model()

class UserProfile(models.Model):
    LOGIN_METHODS = (
        ('email', 'Email'),
        ('otp', 'OTP'),
    )
    
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    mobile = models.CharField(max_length=15, unique=True)
    last_login_method = models.CharField(max_length=10, choices=LOGIN_METHODS, null=True, blank=True)
    last_login_time = models.DateTimeField(null=True, blank=True)
    is_logged_in = models.BooleanField(default=False)

    def __str__(self):
        return self.user.username

    def update_login_info(self, login_method):
        self.last_login_method = login_method
        self.last_login_time = timezone.now()
        self.is_logged_in = True
        self.save()

    def logout(self):
        self.is_logged_in = False
        self.save()

class MobileOTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    attempts = models.IntegerField(default=0)

    def is_valid(self):
        return (
            not self.is_verified and 
            timezone.now() <= self.expires_at and 
            self.attempts < 3
        )

    def increment_attempts(self):
        self.attempts += 1
        self.save()

    def mark_as_verified(self):
        self.is_verified = True
        self.save()

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=10)
        super().save(*args, **kwargs)

    @classmethod
    def cleanup_expired_otps(cls):
        """Clean up expired OTPs"""
        cls.objects.filter(expires_at__lt=timezone.now()).delete()

    class Meta:
        ordering = ['-created_at']
