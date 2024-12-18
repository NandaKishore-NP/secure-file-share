"""
WSGI config for secure_file_share project.
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'secure_file_share.settings')

application = get_wsgi_application() 