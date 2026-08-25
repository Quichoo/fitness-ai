from datetime import date, timedelta
from django.db.models import Max

from workouts.models import WorkoutSet
from workouts.models import Workout
from activities.models import Activity


def estimate_one_rep_max(user_id, exercise_id):
    """
    Estimates 1RM using the Epley formula: weight * (1 + reps/30).
    Uses the heaviest ESTIMATED 1RM across all logged sets for this
    exercise, not just the most recent set - a lower-weight, higher-rep
    set can sometimes estimate a higher 1RM than a recent heavy single.

    Pure deterministic calculation - no AI involved, per architecture.md
    section 41 ("use traditional code for deterministic calculations").
    """
    sets = WorkoutSet.objects.filter(
        workout_exercise__workout__user_id=user_id,
        workout_exercise__exercise_id=exercise_id,
        workout_exercise__workout__is_template=False,
        reps__isnull=False,
        weight_kg__isnull=False,
    )

    best_estimate = None
    for s in sets:
        estimate = float(s.weight_kg) * (1 + float(s.reps) / 30)
        if best_estimate is None or estimate > best_estimate:
            best_estimate = estimate

    return round(best_estimate, 2) if best_estimate is not None else None


def calculate_weekly_workout_frequency(user_id):
    """Counts workouts logged in the last 7 days. Templates don't count -
    they're plans, not training that actually happened."""
    week_ago = date.today() - timedelta(days=7)
    return Workout.objects.filter(user_id=user_id, workout_date__gte=week_ago, is_template=False).count()


def calculate_activity_trends(user_id, activity_type, days=30):
    """
    Average pace and total distance over recent activities of one type.
    Returns None for avg_pace_min_per_km when nothing's logged, rather
    than raising - callers can decide how to handle "no data yet".
    """
    cutoff = date.today() - timedelta(days=days)
    activities = Activity.objects.filter(
        user_id=user_id,
        activity_type=activity_type,
        activity_date__gte=cutoff,
    )

    paced_activities = activities.filter(avg_pace_min_per_km__isnull=False)
    if paced_activities.exists():
        avg_pace = sum(float(a.avg_pace_min_per_km) for a in paced_activities) / paced_activities.count()
        avg_pace = round(avg_pace, 2)
    else:
        avg_pace = None

    total_distance = sum(float(a.distance_km) for a in activities if a.distance_km is not None)

    return {
        "avg_pace_min_per_km": avg_pace,
        "total_distance_km": round(total_distance, 2),
        "activity_count": activities.count(),
    }