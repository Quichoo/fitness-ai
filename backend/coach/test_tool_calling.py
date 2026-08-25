import uuid
from datetime import date
from django.test import TestCase

from workouts.models import Workout
from coach.tool_calling import execute_tool_call, TOOL_DECLARATIONS


class ExecuteToolCallTests(TestCase):
    def setUp(self):
        self.user_id = uuid.uuid4()

    def test_can_execute_an_allowlisted_tool(self):
        Workout.objects.create(user_id=self.user_id, name="Push Day", workout_date=date.today())
        result = execute_tool_call("get_recent_workouts", {}, self.user_id)
        self.assertEqual(len(result), 1)

    def test_rejects_a_tool_name_not_on_the_allowlist(self):
        # This is the real security boundary: even if the AI is somehow
        # tricked into "requesting" something like execute_sql or
        # delete_all_workouts, our code must refuse - never dispatch by
        # name alone without checking the allowlist first.
        with self.assertRaises(PermissionError):
            execute_tool_call("execute_sql", {"query": "DROP TABLE workouts"}, self.user_id)

    def test_rejects_a_plausible_sounding_but_nonexistent_tool(self):
        with self.assertRaises(PermissionError):
            execute_tool_call("delete_all_user_data", {}, self.user_id)

    def test_tool_declarations_only_expose_allowlisted_tools(self):
        declared_names = {t["name"] for t in TOOL_DECLARATIONS}
        self.assertEqual(
            declared_names,
            {
                "get_recent_workouts",
                "get_active_goals",
                "get_recent_activities",
                "create_workout",
                "list_available_exercises",
            },
        )

    def test_create_workout_tool_ignores_extra_unexpected_arguments(self):
        # Even if the AI passes something like user_id in the args (trying
        # to override whose workout gets created), our own user_id
        # parameter - never anything from the args dict - must win.
        other_user = uuid.uuid4()
        from exercises.models import Exercise
        Exercise.objects.create(name="Bench Press", muscle_group="chest")

        result = execute_tool_call(
            "create_workout",
            {"name": "Test", "exercises": [], "user_id": str(other_user)},
            self.user_id,
        )
        workout = Workout.objects.get(id=result["id"])
        self.assertEqual(workout.user_id, self.user_id)
        self.assertNotEqual(workout.user_id, other_user)

    def test_tool_declarations_include_list_available_exercises(self):
        declared_names = {t["name"] for t in TOOL_DECLARATIONS}
        self.assertIn("list_available_exercises", declared_names)