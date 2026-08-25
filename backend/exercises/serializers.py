from rest_framework import serializers
from .models import Exercise


class ExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = [
            "id",
            "name",
            "description",
            "muscle_group",
            "equipment",
            "difficulty",
            "instructions",
            "created_at",
            "updated_at",
        ]