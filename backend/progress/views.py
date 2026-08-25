from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from workouts.models import WorkoutExercise
from exercises.models import Exercise
from progress.stats import estimate_one_rep_max, calculate_weekly_workout_frequency, calculate_activity_trends


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def progress_summary(request):
    user_id = request.user.id

    # Only compute 1RM for exercises this user has actually logged -
    # no point returning null entries for the other 50 exercises in the library.
    logged_exercise_ids = (
        WorkoutExercise.objects.filter(workout__user_id=user_id)
        .values_list("exercise_id", flat=True)
        .distinct()
    )
    one_rep_maxes = []
    for exercise_id in logged_exercise_ids:
        exercise = Exercise.objects.get(id=exercise_id)
        estimate = estimate_one_rep_max(user_id, exercise_id)
        if estimate is not None:
            one_rep_maxes.append({"exercise_name": exercise.name, "estimated_1rm_kg": estimate})

    return Response({
        "weekly_workout_frequency": calculate_weekly_workout_frequency(user_id),
        "one_rep_maxes": one_rep_maxes,
        "running_trends": calculate_activity_trends(user_id, "running"),
        "cycling_trends": calculate_activity_trends(user_id, "cycling"),
    })