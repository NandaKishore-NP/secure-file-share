from django.contrib import admin
from .models import File, FileShare

@admin.register(File)
class FileAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'size', 'mime_type', 'created_at', 'updated_at')
    list_filter = ('mime_type', 'created_at')
    search_fields = ('name', 'owner__username')
    ordering = ('-created_at',)

@admin.register(FileShare)
class FileShareAdmin(admin.ModelAdmin):
    list_display = ('file', 'shared_by', 'shared_with', 'permission', 'expires_at', 'created_at')
    list_filter = ('permission', 'created_at', 'expires_at')
    search_fields = ('file__name', 'shared_by__username', 'shared_with__username')
    ordering = ('-created_at',) 