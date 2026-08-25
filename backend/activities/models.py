import uuid
from django.db import models


class Activity(models.Model):
    ACTIVITY_TYPES = [
        ("running", "Running"),
        ("cycling", "Cycling"),
        ("walking", "Walking"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField(db_index=True)
    activity_type = models.CharField(max_length=30, choices=ACTIVITY_TYPES)
    activity_date = models.DateField()
    distance_km = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    duration_minutes = models.IntegerField(null=True, blank=True)
    avg_pace_min_per_km = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    avg_speed_kmh = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    elevation_gain_m = models.IntegerField(null=True, blank=True)
    avg_heart_rate = models.IntegerField(null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "activities"
        ordering = ["-activity_date"]

    def __str__(self):
        return f"{self.activity_type} - {self.activity_date}"