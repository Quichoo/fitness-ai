from profiles.models import Profile
from goals.models import Goal
from workouts.models import Workout
from activities.models import Activity


def _format_metrics(metrics: dict) -> str:
    """
    Renders a goal's flexible metrics dict into a readable line, without
    assuming a fixed set of keys - different goal categories store
    completely different fields here (a running goal has distance/pace,
    a strength goal has an exercise/1RM), so this just prints whatever
    exists rather than hardcoding field names per category.
    """
    if not metrics:
        return "no specific metrics set"
    return ", ".join(f"{key.replace('_', ' ')}: {value}" for key, value in metrics.items() if value is not None)


def build_user_context(user_id) -> str:
    """
    Gathers ONLY the data relevant to answering a fitness coaching
    question - never the whole database, never another user's data.
    Per architecture.md section 16.

    Returns a plain-text summary suitable for handing to the AI as
    context alongside the user's actual question.
    """
    lines = []

    profile = Profile.objects.filter(id=user_id).first()
    if profile:
        lines.append("User profile:")
        if profile.fitness_level:
            lines.append(f"- Fitness level: {profile.fitness_level}")
        if profile.height_cm:
            lines.append(f"- Height: {profile.height_cm} cm")
        if profile.weight_kg:
            lines.append(f"- Weight: {profile.weight_kg} kg")

    active_goals = Goal.objects.filter(user_id=user_id, status="active")
    if active_goals.exists():
        lines.append("\nActive goals:")
        for goal in active_goals:
            lines.append(f"- {goal.category.replace('_', ' ')} ({goal.objective.replace('_', ' ')})")
            lines.append(f"  Metrics: {_format_metrics(goal.metrics)}")
            if goal.deadline:
                lines.append(f"  Deadline: {goal.deadline}")
            if goal.training_preferences:
                prefs = _format_metrics(goal.training_preferences)
                lines.append(f"  Training availability: {prefs}")

    recent_workouts = Workout.objects.filter(user_id=user_id, is_template=False).order_by("-workout_date")[:5]
    if recent_workouts.exists():
        lines.append("\nRecent workouts:")
        for workout in recent_workouts:
            duration = f" ({workout.duration_minutes} min)" if workout.duration_minutes else ""
            lines.append(f"- {workout.name} on {workout.workout_date}{duration}")

    recent_activities = Activity.objects.filter(user_id=user_id).order_by("-activity_date")[:5]
    if recent_activities.exists():
        lines.append("\nRecent activities (running/cycling):")
        for activity in recent_activities:
            details = []
            if activity.distance_km:
                details.append(f"{activity.distance_km} km")
            if activity.duration_minutes:
                details.append(f"{activity.duration_minutes} min")
            if activity.avg_pace_min_per_km:
                details.append(f"{activity.avg_pace_min_per_km} min/km pace")
            if activity.elevation_gain_m:
                details.append(f"{activity.elevation_gain_m} m elevation gain")
            detail_str = ", ".join(details) if details else "no metrics logged"
            lines.append(f"- {activity.activity_type} on {activity.activity_date}: {detail_str}")

    if not lines:
        return "This user has not logged any profile, goal, or workout data yet."

    return "\n".join(lines)