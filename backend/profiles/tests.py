from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient


class ProfileAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_get_profile_without_token_returns_401(self):
        response = self.client.get("/api/v1/profile")
        self.assertEqual(response.status_code, 401)

    def test_put_profile_without_token_returns_401(self):
        response = self.client.put("/api/v1/profile", {"display_name": "Hacker"}, format="json")
        self.assertEqual(response.status_code, 401)