from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.conf import settings
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.utils import timezone
from datetime import timedelta
import hashlib
import hmac
import secrets
import logging
from .serializers import (
    UserSerializer,
    UserProfileSerializer,
    UserRegisterSerializer,
    UserLoginSerializer,
    UserChangePasswordSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
)
from ..models import UserProfile
from ..models import PasswordResetToken
from api.permissions import IsAdminUser

User = get_user_model()
logger = logging.getLogger(__name__)


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet for User management with authentication endpoints."""
    
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        """Allow unauthenticated access to register and login."""
        if self.action in ['register', 'login', 'forgot_password', 'reset_password']:
            self.permission_classes = [AllowAny]
            return super().get_permissions()

        if self.action in ['list', 'retrieve', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [IsAdminUser]
            return super().get_permissions()

        # Fall back to whatever the view/action configured (including @action overrides).
        return super().get_permissions()
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'register':
            return UserRegisterSerializer
        elif self.action == 'login':
            return UserLoginSerializer
        elif self.action == 'change_password':
            return UserChangePasswordSerializer
        elif self.action == 'forgot_password':
            return PasswordResetRequestSerializer
        elif self.action == 'reset_password':
            return PasswordResetConfirmSerializer
        return self.serializer_class

    @staticmethod
    def _build_auth_user_payload(user):
        """Lightweight user payload for auth endpoints."""
        return {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'department': user.department,
            'is_active': user.is_active,
        }

    @staticmethod
    def _hash_reset_token(raw_token: str) -> str:
        secret = (getattr(settings, 'SECRET_KEY', '') or '').encode('utf-8')
        return hmac.new(secret, raw_token.encode('utf-8'), hashlib.sha256).hexdigest()

    @classmethod
    def _create_password_reset_token(cls, user):
        raw_token = secrets.token_urlsafe(32)
        token_hash = cls._hash_reset_token(raw_token)
        ttl_seconds = int(getattr(settings, 'PASSWORD_RESET_TOKEN_TTL_SECONDS', 3600))
        token_obj = PasswordResetToken.objects.create(
            user=user,
            token_hash=token_hash,
            expires_at=timezone.now() + timedelta(seconds=ttl_seconds),
        )
        return raw_token, token_obj

    @staticmethod
    def _build_reset_url(user, raw_token: str) -> str:
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        frontend_base = getattr(settings, 'FRONTEND_BASE_URL', 'https://example.com')
        return f"{frontend_base.rstrip('/')}/reset-password?uid={uid}&token={raw_token}"
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def register(self, request):
        """
        Register a new user.
        
        Request body:
        {
            "username": "john_doe",
            "email": "john@example.com",
            "password": "securePassword123",
            "password_confirm": "securePassword123",
            "first_name": "John",
            "last_name": "Doe",
            "role": "student",
            "department": "Computer Science"
        }
        """
        try:
            logger.info(f'Register request data: {request.data}')
            serializer = self.get_serializer(data=request.data)
            
            if not serializer.is_valid():
                logger.error(f'Serializer errors: {serializer.errors}')
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
            user = serializer.save()
            logger.info(f'User created: {user.username}')
            
            # Create user profile if it doesn't exist
            UserProfile.objects.get_or_create(user=user)
            
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'message': 'User registered successfully',
                'user': self._build_auth_user_payload(user),
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                }
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.exception(f'Registration error: {str(e)}')
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def login(self, request):
        """
        Login user and return JWT tokens.
        
        Request body:
        {
            "email": "john@example.com",
            "password": "securePassword123"
        }
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': 'Login successful',
            'user': self._build_auth_user_payload(user),
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'])
    def logout(self, request):
        """
        Logout user (invalidate tokens on client side).
        This endpoint can be used for audit logging.
        """
        return Response({
            'message': 'Logout successful'
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get', 'put', 'patch'])
    def me(self, request):
        """Get or update current authenticated user details."""
        try:
            if request.method in ['PUT', 'PATCH']:
                serializer = self.get_serializer(
                    request.user,
                    data=request.data,
                    partial=(request.method == 'PATCH')
                )
                serializer.is_valid(raise_exception=True)
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)
        except Exception as e:
            logger.exception(f'Error in /me/ endpoint: {str(e)}')
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def refresh_token(self, request):
        """
        Refresh access token using refresh token.
        
        Request body:
        {
            "refresh": "refresh_token_here"
        }
        """
        refresh_token = request.data.get('refresh')
        
        if not refresh_token:
            return Response(
                {'error': 'Refresh token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            refresh = RefreshToken(refresh_token)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_401_UNAUTHORIZED
            )
    
    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """
        Change user password.
        
        Request body:
        {
            "old_password": "currentPassword123",
            "new_password": "newPassword123",
            "new_password_confirm": "newPassword123"
        }
        """
        user = request.user
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {'error': 'Old password is incorrect'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response({
            'message': 'Password changed successfully'
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def forgot_password(self, request):
        """Request a password reset link."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email'].strip()
        user = User.objects.filter(email__iexact=email).first()

        # Avoid account enumeration - always return the same response.
        # Only proceed if the user exists AND is active.
        if user and user.is_active:
            raw_token, _ = self._create_password_reset_token(user)
            reset_url = self._build_reset_url(user, raw_token)

            # Local development helper: print a clear reset link in the backend console.
            if settings.DEBUG:
                debug_line = f'RESET LINK FOR {user.email}: {reset_url}'
                print(debug_line, flush=True)
                logger.warning(debug_line)

            subject = 'Educational RMS password reset'
            message = (
                f"Hello {user.get_full_name() or user.username},\n\n"
                "We received a request to reset your password. "
                "Use the link below to set a new password (valid for 1 hour):\n\n"
                f"{reset_url}\n\n"
                "If you did not request this, you can ignore this email."
            )

            try:
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@educational-rms.local'),
                    recipient_list=[user.email],
                    fail_silently=False,
                )
            except Exception:
                logger.exception('Password reset email failed to send for user id=%s', user.id)

        return Response(
            {'message': 'If an account exists for that email, a reset link has been sent.'},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def reset_password(self, request):
        """Reset a password using a token from forgot_password."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            uid = force_str(urlsafe_base64_decode(serializer.validated_data['uid']))
            user = User.objects.get(pk=uid)
        except Exception:
            return Response({'error': 'Invalid reset link.'}, status=status.HTTP_400_BAD_REQUEST)

        if not user.is_active:
            return Response({'error': 'Reset link has expired or is invalid.'}, status=status.HTTP_400_BAD_REQUEST)

        raw_token = serializer.validated_data['token']
        token_hash = self._hash_reset_token(raw_token)

        token_obj = PasswordResetToken.objects.filter(
            user=user,
            token_hash=token_hash,
            used_at__isnull=True,
            expires_at__gt=timezone.now(),
        ).first()

        if not token_obj:
            return Response({'error': 'Reset link has expired or is invalid.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(serializer.validated_data['new_password'])
        user.save(update_fields=['password'])

        token_obj.used_at = timezone.now()
        token_obj.save(update_fields=['used_at'])

        return Response({'message': 'Password reset successfully.'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def send_password_reset(self, request, pk=None):
        """Admin: trigger a password reset email for a user (admin cannot see/set the password)."""
        user = self.get_object()

        if not user.is_active:
            return Response(
                {'error': 'Cannot send password reset for a deactivated account.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        raw_token, _ = self._create_password_reset_token(user)
        reset_url = self._build_reset_url(user, raw_token)

        subject = 'Educational RMS password reset'
        message = (
            f"Hello {user.get_full_name() or user.username},\n\n"
            "An administrator initiated a password reset for your account. "
            "Use the link below to set a new password (valid for 1 hour):\n\n"
            f"{reset_url}\n\n"
            "If you did not expect this, please contact support."
        )

        send_mail(
            subject=subject,
            message=message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@educational-rms.local'),
            recipient_list=[user.email],
            fail_silently=False,
        )

        return Response({'message': 'Password reset email sent.'}, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def roles(self, request):
        """Get available user roles."""
        roles = [
            {'value': role[0], 'label': role[1]}
            for role in User.Role.choices
        ]
        return Response({'roles': roles})


class UserProfileViewSet(viewsets.ModelViewSet):
    """ViewSet for User Profile management."""
    
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return only the profile of the current user."""
        return UserProfile.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get', 'put', 'patch'])
    def me(self, request):
        """Get or update current user's profile."""
        try:
            profile = request.user.profile
        except UserProfile.DoesNotExist:
            profile = UserProfile.objects.create(user=request.user)
        
        if request.method in ['PUT', 'PATCH']:
            serializer = self.get_serializer(
                profile,
                data=request.data,
                partial=(request.method == 'PATCH')
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        serializer = self.get_serializer(profile)
        return Response(serializer.data)
