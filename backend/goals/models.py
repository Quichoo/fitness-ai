import uuid
from django.db import models


class Goal(models.Model):
    CATEGORY_CHOICES = [
        ("weight_loss", "Weight loss"),
        ("muscle_gain", "Muscle gain"),
        ("strength", "Strength"),
        ("running", "Running"),
        ("cycling", "Cycling"),
        ("general_fitness", "General fitness"),
    ]
    STATUS_CHOICES = [
        ("active", "Active"),
        ("completed", "Completed"),
        ("abandoned", "Abandoned"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField(db_index=True)

    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    # Curated per-category identifier (e.g. "one_rep_max", "race_time",
    # "target_weight") - drives which fields the frontend shows and gives
    # the AI coach a concrete label for what kind of goal this is, beyond
    # just the broad category.
    objective = models.CharField(max_length=50)

    # Category-specific current/target numbers live here rather than as
    # separate columns - a running goal's {distance_km, target_time_minutes}
    # looks nothing like a strength goal's {exercise, target_value_kg}, and
    # a flat table of every possible field would be mostly-null noise.
    metrics = models.JSONField(default=dict, blank=True)

    # Deliberately separate from metrics - this is "what the user can
    # realistically train" (days/week, session length, equipment), not
    # part of the goal's target itself. Kept distinct so the AI coach can
    # reason about capability/constraints separately from the target.
    training_preferences = models.JSONField(default=dict, blank=True)

    deadline = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default="active")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "goals"

    def __str__(self):
        return f"{self.category} - {self.objective} ({self.status})"