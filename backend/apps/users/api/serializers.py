from rest_framework import serializers
from django.db.models import Q
from ..models import User, UserProfile


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""
    
    role_display = serializers.CharField(
        source='get_role_display',
        read_only=True
    )
    profile = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'role',
            'role_display',
            'department',
            'is_active',
            'created_at',
            'profile',
        ]
        read_only_fields = ['id', 'created_at', 'profile']
    
    def get_profile(self, obj):
        """Get profile data if exists."""
        try:
            return {
                'phone_number': obj.profile.phone_number,
                'bio': obj.profile.bio,
                'office_location': obj.profile.office_location,
            }
        except UserProfile.DoesNotExist:
            return None


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for UserProfile model."""
    
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = [
            'id',
            'user',
            'phone_number',
            'office_location',
            'bio',
            'avatar',
            'created_at',
        ]
        read_only_fields = ['id', 'user', 'created_at']


class UserRegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={'input_type': 'password'},
        help_text='Password must be at least 8 characters long'
    )
    password_confirm = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
        help_text='Confirm your password'
    )
    
    class Meta:
        model = User
        fields = [
            'username',
            'email',
            'password',
            'password_confirm',
            'first_name',
            'last_name',
            'role',
            'department',
        ]
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': False},
            'last_name': {'required': False},
        }
    
    def validate(self, attrs):
        if attrs.get('password') != attrs.pop('password_confirm'):
            raise serializers.ValidationError(
                {'password': 'Password and confirmation do not match.'}
            )
        return attrs
    
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=validated_data.get('role', User.Role.STUDENT),
            department=validated_data.get('department', ''),
        )
        UserProfile.objects.create(user=user)
        return user


class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login."""
    
    email = serializers.CharField()
    password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, attrs):
        identifier = (attrs.get('email') or '').strip()
        password = attrs.get('password')

        if not identifier:
            raise serializers.ValidationError(
                {'email': ['Email or username is required.']}
            )

        user = User.objects.only(
            'id', 'username', 'email', 'password', 'is_active'
        ).filter(
            Q(email__iexact=identifier) | Q(username__iexact=identifier)
        ).first()

        if not user:
            raise serializers.ValidationError(
                'Invalid email or password.'
            )

        if not user.check_password(password):
            raise serializers.ValidationError(
                'Invalid email or password.'
            )
        
        if not user.is_active:
            raise serializers.ValidationError(
                'This user account is inactive.'
            )
        
        attrs['user'] = user
        return attrs


class UserChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing user password."""
    
    old_password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={'input_type': 'password'}
    )
    new_password_confirm = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, attrs):
        if attrs.get('new_password') != attrs.pop('new_password_confirm'):
            raise serializers.ValidationError(
                {'new_password': 'Password confirmation does not match.'}
            )
        return attrs
