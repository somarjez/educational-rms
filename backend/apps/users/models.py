from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import EmailValidator


class User(AbstractUser):
    """Custom User model with role-based access control."""
    
    class Role(models.TextChoices):
        ADMIN = 'admin', 'Administrator'
        FACULTY = 'faculty', 'Faculty'
        STUDENT = 'student', 'Student'
    
    email = models.EmailField(
        unique=True,
        validators=[EmailValidator()],
        help_text='Email address (unique)'
    )
    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.STUDENT,
        help_text='User role in the system'
    )
    department = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text='Department or faculty affiliation'
    )
    is_active = models.BooleanField(
        default=True,
        help_text='Whether the user account is active'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.get_role_display()})"
    
    def is_admin(self):
        return self.role == self.Role.ADMIN
    
    def is_faculty(self):
        return self.role == self.Role.FACULTY
    
    def is_student(self):
        return self.role == self.Role.STUDENT


class UserProfile(models.Model):
    """Extended user profile information."""
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile'
    )
    phone_number = models.CharField(
        max_length=20,
        blank=True,
        null=True
    )
    office_location = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text='Office or classroom location'
    )
    bio = models.TextField(
        blank=True,
        null=True,
        help_text='Short biography'
    )
    avatar = models.ImageField(
        upload_to='avatars/',
        blank=True,
        null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_profiles'
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'
    
    def __str__(self):
        return f"Profile of {self.user.get_full_name() or self.user.username}"


class PasswordResetToken(models.Model):
    """One-time-use password reset token (stored as a hash)."""

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='password_reset_tokens',
    )
    token_hash = models.CharField(
        max_length=64,
        unique=True,
        db_index=True,
        help_text='HMAC-SHA256 hash of the raw reset token'
    )
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'password_reset_tokens'
        verbose_name = 'Password Reset Token'
        verbose_name_plural = 'Password Reset Tokens'
        ordering = ['-created_at']

    @property
    def is_used(self) -> bool:
        return self.used_at is not None
