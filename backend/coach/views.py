from django.conf import settings
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from exercises.models import Exercise

from coach.clients import GeminiClient
from coach.services import AIService
from coach.context import build_user_context
from coach.rate_limit import check_and_increment_usage, RateLimitExceeded
from coach.models import AIConversation, AIMessage
from coach.serializers import AIConversationListSerializer, AIConversationDetailSerializer
from workouts.models import Workout, WorkoutExercise, WorkoutSet
from coach.workout_generator import parse_workout_json, resolve_exercise_names, WorkoutGenerationError
from coach.serializers import AIConversationListSerializer, AIConversationDetailSerializer
from workouts.serializers import WorkoutSerializer
from progress.stats import estimate_one_rep_max, calculate_weekly_workout_frequency, calculate_activity_trends
from workouts.models import WorkoutExercise as WE
from coach.tool_calling import TOOL_DECLARATIONS, execute_tool_call
from coach.tools import ToolExecutionError

DAILY_AI_LIMIT = 20


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def ai_coach(request):
    message = request.data.get("message", "").strip()
    if not message:
        return Response(
            {"detail": "A non-empty 'message' is required."},
            status=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )

    conversation_id = request.data.get("conversation_id")
    if conversation_id:
        conversation = AIConversation.objects.filter(id=conversation_id, user_id=request.user.id).first()
        if conversation is None:
            return Response({"detail": "Conversation not found."}, status=status.HTTP_404_NOT_FOUND)
    else:
        conversation = AIConversation.objects.create(
            user_id=request.user.id,
            title=message[:60],
        )

    try:
        check_and_increment_usage(request.user.id, daily_limit=DAILY_AI_LIMIT)
    except RateLimitExceeded:
        return Response(
            {"detail": f"Daily AI request limit ({DAILY_AI_LIMIT}) reached. Try again tomorrow."},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    prior_messages = AIMessage.objects.filter(conversation=conversation).order_by("created_at")
    history_lines = [f"{m.role}: {m.content}" for m in prior_messages]

    AIMessage.objects.create(conversation=conversation, role="user", content=message)

    history_block = "\n".join(history_lines) if history_lines else "(no prior messages)"
    prompt = (
        "You are a supportive fitness coach. You are not a doctor and must "
        "not diagnose injuries or medical conditions - encourage professional "
        "evaluation when relevant. You have tools available to look up the "
        "user's real workouts, goals, and activities - use them whenever you "
        "need specific information to answer accurately, rather than guessing "
        "or assuming. If asked to create a workout, use the create_workout "
        "tool with only real exercise names.\n\n"
        f"Conversation so far:\n{history_block}\n\n"
        f"User's new message: {message}"
    )

    try:
        client = GeminiClient(api_key=settings.GEMINI_API_KEY)
        def safe_execute_tool(name, args):
            try:
                return execute_tool_call(name, args, request.user.id)
            except ToolExecutionError as exc:
                # Let the AI see the failure and recover (apologize, try a
                # different exercise, ask the user) instead of the whole
                # request dying with a 503 for what's really a bad AI guess,
                # not a service outage.
                return {"error": str(exc)}
            except PermissionError as exc:
                return {"error": f"Tool not permitted: {exc}"}

        reply = client.generate_with_tools(
            prompt,
            tools=TOOL_DECLARATIONS,
            execute_fn=safe_execute_tool,
        )
    except Exception:
        return Response(
            {"detail": "The AI coach is temporarily unavailable. Please try again later."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    AIMessage.objects.create(conversation=conversation, role="assistant", content=reply)
    conversation.save()

    return Response({"reply": reply, "conversation_id": str(conversation.id)}, status=status.HTTP_200_OK)


class ConversationListView(generics.ListAPIView):
    serializer_class = AIConversationListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return AIConversation.objects.filter(user_id=self.request.user.id)


class ConversationDetailView(generics.RetrieveAPIView):
    serializer_class = AIConversationDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return AIConversation.objects.filter(user_id=self.request.user.id)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def ai_generate_workout(request):
    try:
        check_and_increment_usage(request.user.id, daily_limit=DAILY_AI_LIMIT)
    except RateLimitExceeded:
        return Response(
            {"detail": f"Daily AI request limit ({DAILY_AI_LIMIT}) reached. Try again tomorrow."},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    focus = request.data.get("focus", "a balanced full-body session")
    available_minutes = request.data.get("available_minutes", 45)

    available_exercises = list(Exercise.objects.values_list("name", flat=True))
    context = build_user_context(request.user.id)

    prompt = (
        "You are a fitness coach generating a structured workout. "
        "Respond with ONLY raw JSON, no markdown code fences, no explanation text. "
        "The JSON must have this exact shape: "
        '{"name": string, "duration_minutes": number, '
        '"exercises": [{"exercise_name": string, "sets": [{"reps": number, "weight_kg": number or null}]}]}. '
        "You MUST only use exercise names from this exact list, spelled exactly as shown - "
        "do not invent or modify any exercise name:\n"
        f"{', '.join(available_exercises)}\n\n"
        f"User context:\n{context}\n\n"
        f"Generate a workout focused on: {focus}. "
        f"Target duration: approximately {available_minutes} minutes."
    )

    try:
        client = GeminiClient(api_key=settings.GEMINI_API_KEY)
        service = AIService(client=client)
        raw_response = service.generate_response(prompt)
    except Exception:
        return Response(
            {"detail": "The AI coach is temporarily unavailable. Please try again later."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    try:
        workout_data = parse_workout_json(raw_response)
        resolved_exercises = resolve_exercise_names(workout_data)
    except WorkoutGenerationError as exc:
        return Response(
            {"detail": f"The AI's response couldn't be used to build a workout: {exc}"},
            status=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )

    # Only now, after full validation, does anything touch the database.
    workout = Workout.objects.create(
        user_id=request.user.id,
        name=workout_data["name"],
        workout_date=timezone.now().date(),
        duration_minutes=workout_data.get("duration_minutes"),
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

    serializer = WorkoutSerializer(workout)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def ai_analyze_progress(request):
    try:
        check_and_increment_usage(request.user.id, daily_limit=DAILY_AI_LIMIT)
    except RateLimitExceeded:
        return Response(
            {"detail": f"Daily AI request limit ({DAILY_AI_LIMIT}) reached. Try again tomorrow."},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    # Compute REAL stats first - this is the source of truth, never the AI.
    user_id = request.user.id
    logged_exercise_ids = (
        WE.objects.filter(workout__user_id=user_id).values_list("exercise_id", flat=True).distinct()
    )
    one_rep_maxes = []
    for exercise_id in logged_exercise_ids:
        exercise = Exercise.objects.get(id=exercise_id)
        estimate = estimate_one_rep_max(user_id, exercise_id)
        if estimate is not None:
            one_rep_maxes.append({"exercise_name": exercise.name, "estimated_1rm_kg": estimate})

    stats = {
        "weekly_workout_frequency": calculate_weekly_workout_frequency(user_id),
        "one_rep_maxes": one_rep_maxes,
        "running_trends": calculate_activity_trends(user_id, "running"),
        "cycling_trends": calculate_activity_trends(user_id, "cycling"),
    }

    # The AI only ever explains these already-computed numbers - it never
    # calculates anything itself, per architecture.md section 41.
    prompt = (
        "You are a supportive fitness coach explaining training statistics "
        "in plain, encouraging language. Do not invent or recalculate any "
        "numbers - only explain the ones given below. Keep it concise, "
        "2-4 sentences.\n\n"
        f"Weekly workout frequency: {stats['weekly_workout_frequency']} workouts in the last 7 days\n"
        f"Estimated 1RMs: {stats['one_rep_maxes']}\n"
        f"Running trends (last 30 days): {stats['running_trends']}\n"
        f"Cycling trends (last 30 days): {stats['cycling_trends']}\n"
    )

    try:
        client = GeminiClient(api_key=settings.GEMINI_API_KEY)
        service = AIService(client=client)
        explanation = service.generate_response(prompt)
    except Exception:
        # Graceful degradation: the real numbers are still useful even if
        # the AI explanation fails - never hide computed data behind an
        # AI outage.
        explanation = None

    return Response({"stats": stats, "explanation": explanation}, status=status.HTTP_200_OK)