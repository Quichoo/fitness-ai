from django.test import TestCase
from rest_framework.test import APIClient
from profiles.test_helpers import make_authenticated_client
from exercises.models import Exercise
import uuid


class ExerciseAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_list_exercises_without_token_returns_401(self):
        response = self.client.get("/api/v1/exercises")
        self.assertEqual(response.status_code, 401)


class ExerciseReadOnlyTests(TestCase):
    def setUp(self):
        self.user_id = uuid.uuid4()
        Exercise.objects.create(name="Bench Press", muscle_group="chest")
        Exercise.objects.create(name="Squat", muscle_group="legs")

    def test_authenticated_user_can_list_exercises(self):
        client = make_authenticated_client(APIClient(), self.user_id)
        response = client.get("/api/v1/exercises")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)

    def test_filter_by_muscle_group(self):
        client = make_authenticated_client(APIClient(), self.user_id)
        response = client.get("/api/v1/exercises?muscle_group=legs")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["name"], "Squat")

    def test_post_is_not_allowed(self):
        client = make_authenticated_client(APIClient(), self.user_id)
        response = client.post("/api/v1/exercises", {"name": "Should not work"}, format="json")
        self.assertEqual(response.status_code, 405)
        self.assertEqual(Exercise.objects.filter(name="Should not work").count(), 0)