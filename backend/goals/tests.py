import uuid
from django.test import TestCase
from rest_framework.test import APIClient
from profiles.test_helpers import make_authenticated_client
from goals.models import Goal


class GoalAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_list_goals_without_token_returns_401(self):
        response = self.client.get("/api/v1/goals")
        self.assertEqual(response.status_code, 401)

    def test_create_goal_without_token_returns_401(self):
        response = self.client.post("/api/v1/goals", {"category": "strength"}, format="json")
        self.assertEqual(response.status_code, 401)


class GoalModelTests(TestCase):
    """Tests the new structured goal shape directly at the model level first."""

    def setUp(self):
        self.user_id = uuid.uuid4()

    def test_can_create_running_goal_with_structured_metrics(self):
        goal = Goal.objects.create(
            user_id=self.user_id,
            category="running",
            objective="race_time",
            metrics={
                "distance_km": 10,
                "current_time_minutes": 72,
                "target_time_minutes": 60,
                "event_name": None,
            },
            training_preferences={"days_per_week": 4, "session_duration_minutes": 60},
        )
        self.assertEqual(goal.metrics["target_time_minutes"], 60)
        self.assertEqual(goal.training_preferences["days_per_week"], 4)

    def test_can_create_strength_goal_with_structured_metrics(self):
        goal = Goal.objects.create(
            user_id=self.user_id,
            category="strength",
            objective="one_rep_max",
            metrics={"exercise": "Bench Press", "current_value_kg": 80, "target_value_kg": 100},
        )
        self.assertEqual(goal.metrics["exercise"], "Bench Press")

    def test_metrics_defaults_to_empty_dict(self):
        goal = Goal.objects.create(user_id=self.user_id, category="general_fitness", objective="general")
        self.assertEqual(goal.metrics, {})
        self.assertEqual(goal.training_preferences, {})


class GoalOwnershipTests(TestCase):
    def setUp(self):
        self.user_a_id = uuid.uuid4()
        self.user_b_id = uuid.uuid4()
        self.goal = Goal.objects.create(
            user_id=self.user_a_id,
            category="strength",
            objective="one_rep_max",
            metrics={"exercise": "Squat", "current_value_kg": 80, "target_value_kg": 100},
        )

    def test_owner_can_create_goal(self):
        client = make_authenticated_client(APIClient(), self.user_a_id)
        response = client.post(
            "/api/v1/goals",
            {
                "category": "running",
                "objective": "race_time",
                "metrics": {"distance_km": 5, "target_time_minutes": 25},
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(str(Goal.objects.get(id=response.data["id"]).user_id), str(self.user_a_id))

    def test_owner_can_view_own_goal(self):
        client = make_authenticated_client(APIClient(), self.user_a_id)
        response = client.get(f"/api/v1/goals/{self.goal.id}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["category"], "strength")
        self.assertEqual(response.data["metrics"]["exercise"], "Squat")

    def test_other_user_cannot_view_goal(self):
        client = make_authenticated_client(APIClient(), self.user_b_id)
        response = client.get(f"/api/v1/goals/{self.goal.id}")
        self.assertEqual(response.status_code, 404)

    def test_other_user_cannot_delete_goal(self):
        client = make_authenticated_client(APIClient(), self.user_b_id)
        response = client.delete(f"/api/v1/goals/{self.goal.id}")
        self.assertEqual(response.status_code, 404)
        self.assertTrue(Goal.objects.filter(id=self.goal.id).exists())

    def test_owner_can_delete_own_goal(self):
        client = make_authenticated_client(APIClient(), self.user_a_id)
        response = client.delete(f"/api/v1/goals/{self.goal.id}")
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Goal.objects.filter(id=self.goal.id).exists())