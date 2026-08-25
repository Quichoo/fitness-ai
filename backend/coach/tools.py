from django.utils import timezone

from goals.models import Goal
from workouts.models import Workout, WorkoutExercise, WorkoutSet
from activities.models import Activity
from coach.workout_generator import resolve_exercise_names, WorkoutGenerationError
from exercises.models import Exercise


class ToolExecutionError(Exception):
    """Raised when a tool can't complete - invalid input, not found, etc."""
    pass


def get_recent_workouts(user_id, limit: int = 5) -> list[dict]:
    """
    Allowlisted tool: returns the user's own recent workouts only.
    Ownership is enforced here, not left to the caller - this function
    is safe to call with just a user_id, nothing else to check.
    """
    workouts = Workout.objects.filter(user_id=user_id, is_template=False).order_by("-workout_date")[:limit]
    return [
        {
            "id": str(w.id),
            "name": w.name,
            "workout_date": str(w.workout_date),
            "duration_minutes": w.duration_minutes,
            "source": w.source,
        }
        for w in workouts
    ]


def get_active_goals(user_id) -> list[dict]:
    """Allowlisted tool: returns only the user's own active goals."""
    goals = Goal.objects.filter(user_id=user_id, status="active")
    return [
        {
            "category": g.category,
            "objective": g.objective,
            "metrics": g.metrics,
            "deadline": str(g.deadline) if g.deadline else None,
        }
        for g in goals
    ]


def get_recent_activities(user_id, limit: int = 5) -> list[dict]:
    """Allowlisted tool: returns only the user's own recent activities."""
    activities = Activity.objects.filter(user_id=user_id).order_by("-activity_date")[:limit]
    return [
        {
            "activity_type": a.activity_type,
            "activity_date": str(a.activity_date),
            "distance_km": float(a.distance_km) if a.distance_km else None,
            "duration_minutes": a.duration_minutes,
        }
        for a in activities
    ]


def create_workout_tool(user_id, name: str, exercises: list[dict], duration_minutes: int | None = None) -> dict:
    """
    Allowlisted tool: creates a real workout for this user only.
    Reuses the exact same validation the V3 workout generator uses
    (resolve_exercise_names) - an AI-invented exercise is rejected here
    exactly the same way it's rejected in the dedicated generator endpoint.
    Never trust the AI to only ever call this correctly.
    """
    try:
        resolved_exercises = resolve_exercise_names({"exercises": exercises})
    except WorkoutGenerationError as exc:
        raise ToolExecutionError(str(exc)) from exc

    workout = Workout.objects.create(
        user_id=user_id,
        name=name,
        workout_date=timezone.now().date(),
        duration_minutes=duration_minutes,
        source="ai_generated",
        is_template=True,
    )
    for order, exercise_data in enumerate(resolved_exercises, start=1):
        workout_exercise = WorkoutExercise.objects.create(
            workout=workout,
            exercise_id=exercise_data["exercise_id"],
            exercise_order=order,
        )
        for set_number, set_data in enumerate(exercise_data["sets"], start=1):
            WorkoutSet.objects.create(
                workout_exercise=workout_exercise,
                set_number=set_number,
                reps=set_data.get("reps"),
                weight_kg=set_data.get("weight_kg"),
            )

    return {"id": str(workout.id), "name": workout.name}

def list_available_exercises(user_id) -> list[dict]:
    """
    Allowlisted tool: returns the real exercise library so the AI can
    look up exact names before calling create_workout. user_id is unused
    here (exercises are shared, not user-owned) but kept in the signature
    for a consistent dispatch pattern across every tool.
    """
    return [
        {"name": ex.name, "muscle_group": ex.muscle_group, "equipment": ex.equipment}
        for ex in Exercise.objects.all()
    ]