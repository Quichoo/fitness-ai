"""
Consolidated security status-code matrix, per architecture.md section 33.
Sweeps every endpoint for the baseline cases that must ALWAYS hold:
- No token -> 401
- Cross-user access to a specific resource -> 404 (not 403 - never confirm
  a resource exists to someone who doesn't own it)
- Read-only endpoints reject writes -> 405

This intentionally duplicates a few assertions already covered in each
app's own tests.py - the point isn't new coverage, it's having ONE place
that sweeps the whole surface at a glance, so a future regression on any
endpoint is immediately visible here rather than scattered across files.
"""
import uuid
from datetime import date
from django.test import TestCase
from rest_framework.test import APIClient

from profiles.test_helpers import make_authenticated_client
from goals.models import Goal
from workouts.models import Workout
from activities.models import Activity
from exercises.models import Exercise


UNAUTHENTICATED_ENDPOINTS = [
    ("get", "/api/v1/profile"),
    ("get", "/api/v1/goals"),
    ("get", "/api/v1/exercises"),
    ("get", "/api/v1/workouts"),
    ("get", "/api/v1/activities"),
    ("get", "/api/v1/progress"),
    ("get", "/api/v1/ai/conversations"),
    ("post", "/api/v1/ai/coach"),
    ("post", "/api/v1/ai/workout"),
    ("post", "/api/v1/ai/analyze"),
]


class NoTokenReturns401Tests(TestCase):
    """Every protected endpoint, swept in one place."""

    def setUp(self):
        self.client = APIClient()

    def test_every_protected_endpoint_rejects_missing_auth(self):
        failures = []
        for method, path in UNAUTHENTICATED_ENDPOINTS:
            response = getattr(self.client, method)(path, {}, format="json")
            if response.status_code != 401:
                failures.append(f"{method.upper()} {path} returned {response.status_code}, expected 401")
        self.assertEqual(failures, [], "\n".join(failures))


class CrossUserAccessReturns404Tests(TestCase):
    """Owning-resource endpoints: another user must get 404, never see real data."""

    def setUp(self):
        self.owner_id = uuid.uuid4()
        self.intruder_id = uuid.uuid4()
        self.client = make_authenticated_client(APIClient(), self.intruder_id)

        self.goal = Goal.objects.create(user_id=self.owner_id, category="strength", objective="one_rep_max")
        self.workout = Workout.objects.create(user_id=self.owner_id, name="Private", workout_date=date.today())
        self.activity = Activity.objects.create(
            user_id=self.owner_id, activity_type="running", activity_date=date.today()
        )

    def test_cannot_view_another_users_goal(self):
        response = self.client.get(f"/api/v1/goals/{self.goal.id}")
        self.assertEqual(response.status_code, 404)

    def test_cannot_delete_another_users_goal(self):
        response = self.client.delete(f"/api/v1/goals/{self.goal.id}")
        self.assertEqual(response.status_code, 404)
        self.assertTrue(Goal.objects.filter(id=self.goal.id).exists())

    def test_cannot_view_another_users_workout(self):
        response = self.client.get(f"/api/v1/workouts/{self.workout.id}")
        self.assertEqual(response.status_code, 404)

    def test_cannot_delete_another_users_workout(self):
        response = self.client.delete(f"/api/v1/workouts/{self.workout.id}")
        self.assertEqual(response.status_code, 404)
        self.assertTrue(Workout.objects.filter(id=self.workout.id).exists())

    def test_cannot_view_another_users_activity(self):
        response = self.client.get(f"/api/v1/activities/{self.activity.id}")
        self.assertEqual(response.status_code, 404)

    def test_cannot_delete_another_users_activity(self):
        response = self.client.delete(f"/api/v1/activities/{self.activity.id}")
        self.assertEqual(response.status_code, 404)
        self.assertTrue(Activity.objects.filter(id=self.activity.id).exists())


class ReadOnlyEndpointsReject405Tests(TestCase):
    def setUp(self):
        self.user_id = uuid.uuid4()
        self.client = make_authenticated_client(APIClient(), self.user_id)
        Exercise.objects.create(name="Test Exercise")

    def test_exercises_post_is_rejected(self):
        response = self.client.post("/api/v1/exercises", {"name": "Hacked In"}, format="json")
        self.assertEqual(response.status_code, 405)
        self.assertEqual(Exercise.objects.filter(name="Hacked In").count(), 0)