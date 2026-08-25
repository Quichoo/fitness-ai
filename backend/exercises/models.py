import uuid
from django.db import models


class Exercise(models.Model):
    # Global reference library - deliberately no user_id, since these
    # exercises are shared across every user, not owned by anyone.
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150)
    description = models.TextField(null=True, blank=True)
    muscle_group = models.CharField(max_length=100, null=True, blank=True, db_index=True)
    equipment = models.CharField(max_length=100, null=True, blank=True)
    difficulty = models.CharField(max_length=30, null=True, blank=True)
    instructions = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "exercises"
        ordering = ["name"]

    def __str__(self):
        return self.name