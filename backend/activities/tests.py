import uuid
from datetime import date
from django.test import TestCase
from rest_framework.test import APIClient
from profiles.test_helpers import make_authenticated_client
from activities.models import Activity


class ActivityAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_list_activities_without_token_returns_401(self):
        response = self.client.get("/api/v1/activities")
        self.assertEqual(response.status_code, 401)

    def test_create_activity_without_token_returns_401(self):
        response = self.client.post("/api/v1/activities", {"activity_type": "running"}, format="json")
        self.assertEqual(response.status_code, 401)


class ActivityModelTests(TestCase):
    def setUp(self):
        self.user_id = uuid.uuid4()

    def test_can_create_running_activity(self):
        activity = Activity.objects.create(
            user_id=self.user_id,
            activity_type="running",
            activity_date=date.today(),
            distance_km=5.2,
            duration_minutes=28,
        )
        self.assertEqual(activity.activity_type, "running")
        self.assertEqual(float(activity.distance_km), 5.2)

    def test_can_create_cycling_activity_with_elevation(self):
        activity = Activity.objects.create(
            user_id=self.user_id,
            activity_type="cycling",
            activity_date=date.today(),
            distance_km=40,
            duration_minutes=90,
            elevation_gain_m=350,
        )
        self.assertEqual(activity.elevation_gain_m, 350)


class ActivityOwnershipTests(TestCase):
    def setUp(self):
        self.user_a_id = uuid.uuid4()
        self.user_b_id = uuid.uuid4()
        self.activity = Activity.objects.create(
            user_id=self.user_a_id,
            activity_type="running",
            activity_date=date.today(),
            distance_km=5,
            duration_minutes=30,
        )

    def test_owner_can_create_activity(self):
        client = make_authenticated_client(APIClient(), self.user_a_id)
        response = client.post(
            "/api/v1/activities",
            {
                "activity_type": "running",
                "activity_date": str(date.today()),
                "distance_km": 10,
                "duration_minutes": 55,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(str(Activity.objects.get(id=response.data["id"]).user_id), str(self.user_a_id))

    def test_list_only_returns_own_activities(self):
        Activity.objects.create(
            user_id=self.user_b_id, activity_type="cycling", activity_date=date.today(), distance_km=20, duration_minutes=60
        )
        client = make_authenticated_client(APIClient(), self.user_a_id)
        response = client.get("/api/v1/activities")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_other_user_cannot_view_activity(self):
        client = make_authenticated_client(APIClient(), self.user_b_id)
        response = client.get(f"/api/v1/activities/{self.activity.id}")
        self.assertEqual(response.status_code, 404)

    def test_other_user_cannot_delete_activity(self):
        client = make_authenticated_client(APIClient(), self.user_b_id)
        response = client.delete(f"/api/v1/activities/{self.activity.id}")
        self.assertEqual(response.status_code, 404)
        self.assertTrue(Activity.objects.filter(id=self.activity.id).exists())

    def test_owner_can_delete_own_activity(self):
        client = make_authenticated_client(APIClient(), self.user_a_id)
        response = client.delete(f"/api/v1/activities/{self.activity.id}")
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Activity.objects.filter(id=self.activity.id).exists())