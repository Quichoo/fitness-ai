import uuid
from django.db import models
from exercises.models import Exercise


class Workout(models.Model):
    SOURCE_CHOICES = [
        ("manual", "Manual"),
        ("ai_generated", "AI generated"),
        ("template", "Template"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField(db_index=True)
    name = models.CharField(max_length=150)
    workout_date = models.DateField()
    duration_minutes = models.IntegerField(null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    source = models.CharField(max_length=30, choices=SOURCE_CHOICES, default="manual")
    is_template = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "workouts"
        ordering = ["-workout_date"]

    def __str__(self):
        return self.name


class WorkoutExercise(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # ForeignKey here (unlike user_id above) because Workout and Exercise
    # ARE Django models in this same project - related_name lets us access
    # workout.exercises.all() later, similar to the relationship() we set
    # up in SQLAlchemy before.
    workout = models.ForeignKey(Workout, on_delete=models.CASCADE, related_name="exercises")
    exercise = models.ForeignKey(Exercise, on_delete=models.PROTECT)
    exercise_order = models.PositiveIntegerField()
    notes = models.TextField(null=True, blank=True)

    class Meta:
        db_table = "workout_exercises"
        ordering = ["exercise_order"]


class WorkoutSet(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workout_exercise = models.ForeignKey(WorkoutExercise, on_delete=models.CASCADE, related_name="sets")
    set_number = models.PositiveIntegerField()
    reps = models.IntegerField(null=True, blank=True)
    weight_kg = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    duration_seconds = models.IntegerField(null=True, blank=True)
    distance_meters = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    rpe = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)
    completed = models.BooleanField(default=False)

    class Meta:
        db_table = "workout_sets"
        ordering = ["set_number"]