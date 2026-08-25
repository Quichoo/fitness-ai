from coach.tools import (
    get_recent_workouts,
    get_active_goals,
    get_recent_activities,
    create_workout_tool,
    list_available_exercises,
)

# The allowlist itself. This dict IS the security boundary - a tool name
# not present here can never be dispatched, no matter what the AI requests.
_ALLOWED_TOOLS = {
    "get_recent_workouts": get_recent_workouts,
    "get_active_goals": get_active_goals,
    "get_recent_activities": get_recent_activities,
    "create_workout": create_workout_tool,
    "list_available_exercises": list_available_exercises,
}

# JSON schema declarations handed to Gemini, describing what each tool
# does and what arguments it accepts. Deliberately does NOT include
# user_id as a parameter anywhere - the AI is never given the ability to
# specify whose data to access, that always comes from the authenticated
# request itself.
TOOL_DECLARATIONS = [
    {
        "name": "get_recent_workouts",
        "description": "Get the user's most recent logged workouts.",
        "parameters": {"type": "object", "properties": {}},
    },
    {
        "name": "get_active_goals",
        "description": "Get the user's currently active fitness goals.",
        "parameters": {"type": "object", "properties": {}},
    },
    {
        "name": "get_recent_activities",
        "description": "Get the user's most recent running/cycling/walking activities.",
        "parameters": {"type": "object", "properties": {}},
    },
    {
        "name": "list_available_exercises",
        "description": "Get the full list of real exercises available in the library, with exact names. ALWAYS call this before create_workout to get exact spelling - never guess an exercise name.",
        "parameters": {"type": "object", "properties": {}},
    },
    {
        "name": "create_workout",
        "description": "Create and save a new workout for the user, using only real exercises from the library.",
        "parameters": {
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "duration_minutes": {"type": "integer"},
                "exercises": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "exercise_name": {"type": "string"},
                            "sets": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "reps": {"type": "integer"},
                                        "weight_kg": {"type": "number"},
                                    },
                                },
                            },
                        },
                        "required": ["exercise_name", "sets"],
                    },
                },
            },
            "required": ["name", "exercises"],
        },
    },
]


def execute_tool_call(tool_name: str, args: dict, user_id) -> dict:
    """
    The single dispatch point for every tool call, whether it comes from
    a real Gemini function-call response or anywhere else. Enforces the
    allowlist first, then strips any user_id the AI might have included
    in its own arguments before calling the real function - user_id
    always comes from the authenticated request, never from tool args.
    """
    if tool_name not in _ALLOWED_TOOLS:
        raise PermissionError(f"Tool '{tool_name}' is not on the allowlist and cannot be executed.")

    safe_args = {k: v for k, v in args.items() if k != "user_id"}
    return _ALLOWED_TOOLS[tool_name](user_id, **safe_args)