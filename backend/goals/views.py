from rest_framework import generics, permissions
from .models import Goal
from .serializers import GoalSerializer


class GoalListCreateView(generics.ListCreateAPIView):
    """Handles GET (list) and POST (create) at /api/v1/goals"""
    serializer_class = GoalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only ever return goals belonging to the authenticated user -
        # this is the ownership filter, applied at the query level so
        # there's no way to accidentally leak someone else's goals.
        return Goal.objects.filter(user_id=self.request.user.id).order_by("-created_at")

    def perform_create(self, serializer):
        # The user_id is set here, from the verified token - never from
        # anything the client sends in the request body.
        serializer.save(user_id=self.request.user.id)


class GoalDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Handles GET/PUT/PATCH/DELETE for a single goal at /api/v1/goals/<id>"""
    serializer_class = GoalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Same ownership filter as above. Because this queryset is already
        # scoped to the current user, if someone requests a goal ID that
        # exists but belongs to someone else, Django simply won't find it
        # in this filtered set - and DRF automatically returns 404, not 403.
        # This avoids leaking "that goal exists, you're just not allowed to
        # see it" - exactly the same not-found-vs-not-yours principle we
        # used in the FastAPI version.
        return Goal.objects.filter(user_id=self.request.user.id)