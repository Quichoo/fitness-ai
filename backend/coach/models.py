import uuid
from django.db import models


class AIUsage(models.Model):
    """
    Tracks daily AI request counts per user, enforcing the rate limit
    described in architecture.md section 21 (e.g. 20 requests/day/user).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField(db_index=True)
    request_date = models.DateField()
    request_count = models.IntegerField(default=0)
    input_tokens = models.IntegerField(default=0)
    output_tokens = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "ai_usage"
        # A user should only ever have ONE row per day - this constraint
        # makes that a database-level guarantee, not just an app convention.
        constraints = [
            models.UniqueConstraint(fields=["user_id", "request_date"], name="unique_user_per_day")
        ]

    def __str__(self):
        return f"{self.user_id} - {self.request_date} ({self.request_count} requests)"

class AIConversation(models.Model):
    """One conversation thread. A user can have many."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField(db_index=True)
    title = models.CharField(max_length=150, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "ai_conversations"
        ordering = ["-updated_at"]

    def __str__(self):
        return self.title or f"Conversation {self.id}"


class AIMessage(models.Model):
    ROLE_CHOICES = [
        ("user", "User"),
        ("assistant", "Assistant"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(AIConversation, on_delete=models.CASCADE, related_name="messages")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ai_messages"
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.role}: {self.content[:50]}"