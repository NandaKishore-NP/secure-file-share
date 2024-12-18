from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
import pyotp

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'mfa_enabled', 'email_verified')
        read_only_fields = ('id', 'role', 'mfa_enabled', 'email_verified')

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user

class MFASerializer(serializers.Serializer):
    token = serializers.CharField(required=True)

    def validate_token(self, value):
        user = self.context['request'].user
        if not user.mfa_secret:
            raise serializers.ValidationError("MFA is not set up for this user.")
        
        totp = pyotp.TOTP(user.mfa_secret)
        if not totp.verify(value):
            raise serializers.ValidationError("Invalid MFA token.")
        return value

class MFASetupSerializer(serializers.Serializer):
    token = serializers.CharField(required=True)

    def validate_token(self, value):
        user = self.context['request'].user
        if not user.mfa_secret:
            raise serializers.ValidationError("MFA secret not generated.")
        
        totp = pyotp.TOTP(user.mfa_secret)
        if not totp.verify(value):
            raise serializers.ValidationError("Invalid MFA token.")
        return value 