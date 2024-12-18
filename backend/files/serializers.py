from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import File, FileShare

User = get_user_model()

class FileSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = File
        fields = ('id', 'name', 'owner', 'encrypted_key', 'created_at', 'updated_at', 'size', 'mime_type', 'download_url')
        read_only_fields = ('owner', 'created_at', 'updated_at')

    def get_download_url(self, obj):
        request = self.context.get('request')
        if request is not None:
            return request.build_absolute_uri(f'/api/v1/files/{obj.id}/download/')
        return None

class FileUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    encrypted_key = serializers.CharField()
    name = serializers.CharField(max_length=255)

class FileShareSerializer(serializers.ModelSerializer):
    shared_by = serializers.ReadOnlyField(source='shared_by.username')
    shared_with_username = serializers.CharField(write_only=True, required=False)
    share_url = serializers.SerializerMethodField()

    class Meta:
        model = FileShare
        fields = ('id', 'file', 'shared_by', 'shared_with', 'shared_with_username',
                 'permission', 'expires_at', 'created_at', 'encrypted_key',
                 'share_token', 'share_url')
        read_only_fields = ('shared_by', 'share_token', 'created_at')
        extra_kwargs = {
            'shared_with': {'required': False},
            'encrypted_key': {'write_only': True}
        }

    def get_share_url(self, obj):
        request = self.context.get('request')
        if request is not None:
            return request.build_absolute_uri(f'/api/v1/files/share/{obj.share_token}/')
        return None

    def validate_shared_with_username(self, value):
        try:
            return User.objects.get(username=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("User does not exist")

    def validate(self, attrs):
        if 'shared_with_username' in attrs:
            attrs['shared_with'] = attrs.pop('shared_with_username')
        return attrs

class SharedFileSerializer(serializers.ModelSerializer):
    file = FileSerializer()
    shared_by = serializers.ReadOnlyField(source='shared_by.username')

    class Meta:
        model = FileShare
        fields = ('id', 'file', 'shared_by', 'permission', 'expires_at', 'created_at', 'encrypted_key') 