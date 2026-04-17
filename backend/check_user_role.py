#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()
u = User.objects.get(username='testuser123')
print(f'Username: {u.username}')
print(f'Role: {repr(u.role)}')
print(f'Role == "admin": {u.role == "admin"}')
print(f'Role == "ADMIN": {u.role == "ADMIN"}')
print(f'Role.upper() == "ADMIN": {u.role.upper() == "ADMIN"}')
