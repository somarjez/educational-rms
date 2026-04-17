from .base import *

# Production security settings for Render
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_SECURITY_POLICY = {
    'default-src': ("'self'",),
}
X_FRAME_OPTIONS = 'DENY'

# Allow Render.com domain
ALLOWED_HOSTS += ['*.render.com', 'educational-rms-api.render.com']
