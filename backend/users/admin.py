from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin

User = get_user_model()

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'mfa_enabled', 'email_verified', 'date_joined')
    list_filter = ('role', 'mfa_enabled', 'email_verified')
    search_fields = ('username', 'email')
    ordering = ('-date_joined',) 