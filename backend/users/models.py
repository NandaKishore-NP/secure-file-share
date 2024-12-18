from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _

class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', _('Admin')
        USER = 'USER', _('User')
        GUEST = 'GUEST', _('Guest')

    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.USER,
    )
    mfa_secret = models.CharField(max_length=32, blank=True, null=True)
    mfa_enabled = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)

    class Meta:
        db_table = 'auth_user'

    def __str__(self):
        return self.username

    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN

    @property
    def is_regular_user(self):
        return self.role == self.Role.USER

    @property
    def is_guest(self):
        return self.role == self.Role.GUEST 