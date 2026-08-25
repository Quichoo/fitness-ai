from datetime import date
from django.db import transaction
from coach.models import AIUsage


class RateLimitExceeded(Exception):
    """Raised when a user has hit their daily AI request limit."""
    pass


def check_and_increment_usage(user_id, daily_limit: int) -> None:
    """
    Atomically checks whether the user is under their daily limit, and if
    so, increments their usage count. Raises RateLimitExceeded if not.

    Wrapped in a transaction with select_for_update to avoid a race
    condition where two simultaneous requests both pass the check before
    either increments - without this, a user could sneak in one extra
    request right at the boundary.
    """
    with transaction.atomic():
        usage, _created = AIUsage.objects.select_for_update().get_or_create(
            user_id=user_id,
            request_date=date.today(),
            defaults={"request_count": 0},
        )

        if usage.request_count >= daily_limit:
            raise RateLimitExceeded(f"Daily AI request limit ({daily_limit}) reached.")

        usage.request_count += 1
        usage.save()