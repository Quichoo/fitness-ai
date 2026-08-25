import uuid
from django.test import TestCase
from rest_framework.test import APIClient
from profiles.test_helpers import make_authenticated_client
from workouts.models import Workout, WorkoutExercise, WorkoutSet
from exercises.models import Exercise


class WorkoutAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_list_workouts_without_token_returns_401(self):
        response = self.client.get("/api/v1/workouts")
        self.assertEqual(response.status_code, 401)

    def test_create_workout_without_token_returns_401(self):
        response = self.client.post("/api/v1/workouts", {"name": "Test"}, format="json")
        self.assertEqual(response.status_code, 401)


class WorkoutOwnershipTests(TestCase):
    def setUp(self):
        self.user_a_id = uuid.uuid4()
        self.user_b_id = uuid.uuid4()
        self.exercise = Exercise.objects.create(name="Bench Press", muscle_group="chest")
        self.workout = Workout.objects.create(
            user_id=self.user_a_id,
            name="Push Day",
            workout_date="2026-08-16",
        )

    def test_other_user_cannot_view_workout(self):
        client = make_authenticated_client(APIClient(), self.user_b_id)
        response = client.get(f"/api/v1/workouts/{self.workout.id}")
        self.assertEqual(response.status_code, 404)

    def test_list_only_returns_own_workouts(self):
        Workout.objects.create(user_id=self.user_b_id, name="Someone else's workout", workout_date="2026-08-16")
        client = make_authenticated_client(APIClient(), self.user_a_id)
        response = client.get("/api/v1/workouts")
        self.assertEqual(response.status_code, 200)
        names = [w["name"] for w in response.data]
        self.assertIn("Push Day", names)
        self.assertNotIn("Someone else's workout", names)

    def test_nested_create_saves_exercises_and_sets(self):
        client = make_authenticated_client(APIClient(), self.user_a_id)
        payload = {
            "name": "Leg Day",
            "workout_date": "2026-08-16",
            "exercises": [
                {
                    "exercise_id": str(self.exercise.id),
                    "exercise_order": 1,
                    "sets": [
                        {"set_number": 1, "reps": 8, "weight_kg": 60},
                        {"set_number": 2, "reps": 6, "weight_kg": 65},
                    ],
                }
            ],
        }
        response = client.post("/api/v1/workouts", payload, format="json")
        self.assertEqual(response.status_code, 201)

        workout = Workout.objects.get(id=response.data["id"])
        self.assertEqual(WorkoutExercise.objects.filter(workout=workout).count(), 1)
        self.assertEqual(WorkoutSet.objects.filter(workout_exercise__workout=workout).count(), 2)

    def test_delete_cascades_to_exercises_and_sets(self):
        workout_exercise = WorkoutExercise.objects.create(
            workout=self.workout, exercise=self.exercise, exercise_order=1
        )
        WorkoutSet.objects.create(workout_exercise=workout_exercise, set_number=1, reps=10)

        client = make_authenticated_client(APIClient(), self.user_a_id)
        response = client.delete(f"/api/v1/workouts/{self.workout.id}")
        self.assertEqual(response.status_code, 204)

        self.assertFalse(WorkoutExercise.objects.filter(id=workout_exercise.id).exists())
        self.assertFalse(WorkoutSet.objects.filter(workout_exercise=workout_exercise).exists())

    def test_workout_defaults_to_not_a_template(self):
        workout = Workout.objects.create(user_id=self.user_a_id, name="Test", workout_date="2026-08-22")
        self.assertFalse(workout.is_template)

    def test_serializer_includes_is_template(self):
        client = make_authenticated_client(APIClient(), self.user_a_id)
        response = client.get(f"/api/v1/workouts/{self.workout.id}")
        self.assertIn("is_template", response.data)