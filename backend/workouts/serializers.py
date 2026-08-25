from rest_framework import serializers
from .models import Workout, WorkoutExercise, WorkoutSet
from exercises.models import Exercise


class WorkoutSetSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkoutSet
        fields = [
            "id", "set_number", "reps", "weight_kg",
            "duration_seconds", "distance_meters", "rpe", "completed",
        ]
        read_only_fields = ["id"]


class WorkoutExerciseSerializer(serializers.ModelSerializer):
    exercise_id = serializers.PrimaryKeyRelatedField(source="exercise", queryset=Exercise.objects.all())
    sets = WorkoutSetSerializer(many=True)

    class Meta:
        model = WorkoutExercise
        fields = ["id", "exercise_id", "exercise_order", "notes", "sets"]
        read_only_fields = ["id"]


class WorkoutSerializer(serializers.ModelSerializer):
    exercises = WorkoutExerciseSerializer(many=True, required=False)

    class Meta:
        model = Workout
        fields = [
            "id", "name", "workout_date", "duration_minutes", "notes",
            "source", "is_template", "created_at", "updated_at", "exercises",
        ]
        read_only_fields = ["id", "source", "created_at", "updated_at"]

    def create(self, validated_data):
        exercises_data = validated_data.pop("exercises", [])
        workout = Workout.objects.create(**validated_data)

        for exercise_data in exercises_data:
            sets_data = exercise_data.pop("sets", [])
            workout_exercise = WorkoutExercise.objects.create(workout=workout, **exercise_data)
            for set_data in sets_data:
                WorkoutSet.objects.create(workout_exercise=workout_exercise, **set_data)

        return workout


class WorkoutListSerializer(serializers.ModelSerializer):
    """Lighter payload for list views - no nested exercises/sets, matches
    the same 'don't fetch everything at once' principle from architecture.md."""

    class Meta:
        model = Workout
        fields = ["id", "name", "workout_date", "duration_minutes", "source", "is_template"]