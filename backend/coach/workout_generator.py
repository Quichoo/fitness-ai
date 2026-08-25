import json
import re
from exercises.models import Exercise


class WorkoutGenerationError(Exception):
    """Raised when the AI's workout output can't be parsed or is missing required data."""
    pass


def _strip_markdown_fences(raw: str) -> str:
    """
    Gemini sometimes wraps JSON output in ```json ... ``` code fences even
    when explicitly told not to. Strip them defensively before parsing,
    rather than trusting the AI to always follow formatting instructions.
    """
    stripped = raw.strip()
    match = re.match(r"^```(?:json)?\s*(.*?)\s*```$", stripped, re.DOTALL)
    if match:
        return match.group(1)
    return stripped


def parse_workout_json(raw: str) -> dict:
    """
    Parses and validates the AI's raw text response into a workout dict.
    Raises WorkoutGenerationError for anything malformed or incomplete -
    this is the validation gate architecture.md section 18 requires
    before ANY AI-generated data reaches the database.
    """
    cleaned = _strip_markdown_fences(raw)

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise WorkoutGenerationError(f"AI response was not valid JSON: {exc}") from exc

    if "name" not in data or "duration_minutes" not in data or "exercises" not in data:
        raise WorkoutGenerationError("AI response is missing required fields (name, duration_minutes, exercises).")

    for exercise in data["exercises"]:
        if "exercise_name" not in exercise or "sets" not in exercise:
            raise WorkoutGenerationError("An exercise in the AI response is missing exercise_name or sets.")

    return data

def resolve_exercise_names(workout_data: dict) -> list[dict]:
    """
    Matches each AI-provided exercise_name against the REAL exercise
    library, case-insensitively. Raises WorkoutGenerationError if the AI
    referenced anything that doesn't actually exist - this is what
    prevents an invented exercise from ever reaching the database.

    Returns a list of dicts with exercise_id resolved in, ready to be
    saved via the same nested-create pattern the manual workout endpoint
    already uses.
    """
    resolved = []
    for exercise_data in workout_data["exercises"]:
        name = exercise_data["exercise_name"]
        exercise = Exercise.objects.filter(name__iexact=name).first()
        if exercise is None:
            raise WorkoutGenerationError(
                f"AI referenced an exercise that doesn't exist in the library: '{name}'"
            )
        resolved.append({
            "exercise_id": exercise.id,
            "sets": exercise_data["sets"],
        })
    return resolved