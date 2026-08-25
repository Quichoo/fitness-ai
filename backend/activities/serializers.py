from rest_framework import serializers
from .models import Activity


class ActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Activity
        fields = [
            "id",
            "activity_type",
            "activity_date",
            "distance_km",
            "duration_minutes",
            "avg_pace_min_per_km",
            "avg_speed_kmh",
            "elevation_gain_m",
            "avg_heart_rate",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]