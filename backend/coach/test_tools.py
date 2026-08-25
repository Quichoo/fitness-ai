import uuid
from datetime import date
from django.test import TestCase
from coach.tools import list_available_exercises

from profiles.models import Profile
from goals.models import Goal
from workouts.models import Workout, WorkoutExercise, WorkoutSet
from activities.models import Activity
from exercises.models import Exercise
from coach.tools import (
    get_recent_workouts,
    get_active_goals,
    get_recent_activities,
    create_workout_tool,
    ToolExecutionError,
)


class GetRecentWorkoutsToolTests(TestCase):
    def setUp(self):
        self.user_id = uuid.uuid4()
        self.other_user_id = uuid.uuid4()

    def test_returns_own_recent_workouts(self):
        Workout.objects.create(user_id=self.user_id, name="Push Day", workout_date=date.today())
        result = get_recent_workouts(self.user_id)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["name"], "Push Day")

    def test_never_returns_another_users_workouts(self):
        Workout.objects.create(user_id=self.other_user_id, name="Not Mine", workout_date=date.today())
        result = get_recent_workouts(self.user_id)
        self.assertEqual(len(result), 0)

    def test_limits_to_a_reasonable_number(self):
        for i in range(10):
            Workout.objects.create(user_id=self.user_id, name=f"Workout {i}", workout_date=date.today())
        result = get_recent_workouts(self.user_id)
        self.assertLessEqual(len(result), 5)

    def test_excludes_templates(self):
        Workout.objects.create(user_id=self.user_id, name="Real", workout_date=date.today())
        Workout.objects.create(user_id=self.user_id, name="Plan", workout_date=date.today(), is_template=True)

        result = get_recent_workouts(self.user_id)
        names = [w["name"] for w in result]
        self.assertIn("Real", names)
        self.assertNotIn("Plan", names)


class GetActiveGoalsToolTests(TestCase):
    def setUp(self):
        self.user_id = uuid.uuid4()
        self.other_user_id = uuid.uuid4()

    def test_returns_only_active_goals(self):
        Goal.objects.create(user_id=self.user_id, category="strength", objective="one_rep_max", status="active")
        Goal.objects.create(user_id=self.user_id, category="running", objective="race_time", status="completed")
        result = get_active_goals(self.user_id)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["category"], "strength")

    def test_never_returns_another_users_goals(self):
        Goal.objects.create(user_id=self.other_user_id, category="strength", objective="one_rep_max", status="active")
        result = get_active_goals(self.user_id)
        self.assertEqual(len(result), 0)


class GetRecentActivitiesToolTests(TestCase):
    def setUp(self):
        self.user_id = uuid.uuid4()
        self.other_user_id = uuid.uuid4()

    def test_returns_own_activities(self):
        Activity.objects.create(user_id=self.user_id, activity_type="running", activity_date=date.today(), distance_km=5)
        result = get_recent_activities(self.user_id)
        self.assertEqual(len(result), 1)

    def test_never_returns_another_users_activities(self):
        Activity.objects.create(user_id=self.other_user_id, activity_type="cycling", activity_date=date.today(), distance_km=20)
        result = get_recent_activities(self.user_id)
        self.assertEqual(len(result), 0)


class CreateWorkoutToolTests(TestCase):
    def setUp(self):
        self.user_id = uuid.uuid4()
        self.bench = Exercise.objects.create(name="Bench Press", muscle_group="chest")

    def test_creates_a_real_workout_owned_by_the_user(self):
        result = create_workout_tool(
            self.user_id,
            name="Tool-created workout",
            exercises=[{"exercise_name": "Bench Press", "sets": [{"reps": 8, "weight_kg": 60}]}],
        )
        workout = Workout.objects.get(id=result["id"])
        self.assertEqual(workout.user_id, self.user_id)
        self.assertEqual(workout.source, "ai_generated")

    def test_rejects_invented_exercise_names(self):
        with self.assertRaises(ToolExecutionError):
            create_workout_tool(
                self.user_id,
                name="Bad workout",
                exercises=[{"exercise_name": "Made Up Exercise", "sets": [{"reps": 8}]}],
            )
        self.assertEqual(Workout.objects.count(), 0)

    def test_created_workout_is_a_template(self):
        result = create_workout_tool(
            self.user_id,
            name="Tool-created workout",
            exercises=[{"exercise_name": "Bench Press", "sets": [{"reps": 8, "weight_kg": 60}]}],
        )
        workout = Workout.objects.get(id=result["id"])
        self.assertTrue(workout.is_template)

class ListAvailableExercisesToolTests(TestCase):
    def test_returns_real_exercise_names(self):
        Exercise.objects.create(name="Push-up", muscle_group="chest", equipment="bodyweight")
        Exercise.objects.create(name="Squat", muscle_group="legs", equipment="barbell")

        result = list_available_exercises(uuid.uuid4())  # user_id unused but kept for consistent tool signature

        names = [ex["name"] for ex in result]
        self.assertIn("Push-up", names)
        self.assertIn("Squat", names)