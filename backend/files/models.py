from django.db import models
from django.conf import settings
from django.utils import timezone
import os
import uuid

def get_file_path(instance, filename):
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('uploads', filename)

class File(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='files')
    name = models.CharField(max_length=255)
    file = models.FileField(upload_to=get_file_path)
    encrypted_key = models.TextField()  # Encrypted file key
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    size = models.BigIntegerField()
    mime_type = models.CharField(max_length=255)

    def __str__(self):
        return self.name

    def delete(self, *args, **kwargs):
        # Delete the file from storage when the model is deleted
        if self.file:
            if os.path.isfile(self.file.path):
                os.remove(self.file.path)
        super().delete(*args, **kwargs)

class FileShare(models.Model):
    class Permission(models.TextChoices):
        VIEW = 'VIEW', 'View'
        DOWNLOAD = 'DOWNLOAD', 'Download'

    file = models.ForeignKey(File, on_delete=models.CASCADE, related_name='shares')
    shared_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='shared_files')
    shared_with = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_files', null=True, blank=True)
    share_token = models.UUIDField(default=uuid.uuid4, editable=False)
    permission = models.CharField(max_length=10, choices=Permission.choices, default=Permission.VIEW)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    encrypted_key = models.TextField()  # Re-encrypted file key for recipient

    def __str__(self):
        return f"{self.file.name} shared by {self.shared_by.username}"

    @property
    def is_expired(self):
        if self.expires_at:
            return timezone.now() > self.expires_at
        return False

    def save(self, *args, **kwargs):
        if not self.share_token:
            self.share_token = uuid.uuid4()
        super().save(*args, **kwargs) 