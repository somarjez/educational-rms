from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from apps.users.api.views import UserViewSet


class Command(BaseCommand):
    help = "Print a one-time password reset link for an existing active user email."

    def add_arguments(self, parser):
        parser.add_argument("email", type=str, help="User email address")

    def handle(self, *args, **options):
        email = options["email"].strip()
        if not email:
            self.stdout.write(self.style.ERROR("Email is required."))
            return

        user_model = get_user_model()
        user = user_model.objects.filter(email__iexact=email).first()

        if not user:
            self.stdout.write(self.style.ERROR("No user found with that email."))
            return

        if not user.is_active:
            self.stdout.write(self.style.ERROR("User is deactivated. Reset link not generated."))
            return

        raw_token, _ = UserViewSet._create_password_reset_token(user)
        reset_url = UserViewSet._build_reset_url(user, raw_token)

        self.stdout.write(self.style.SUCCESS(f"RESET LINK FOR {user.email}: {reset_url}"))
        self.stdout.write("Note: this token is one-time use and expires according to PASSWORD_RESET_TOKEN_TTL_SECONDS.")
