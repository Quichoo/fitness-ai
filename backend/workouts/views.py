from rest_framework import generics, permissions
from .models import Workout
from .serializers import WorkoutSerializer, WorkoutListSerializer


class WorkoutListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Workout.objects.filter(user_id=self.request.user.id)

    def get_serializer_class(self):
        # Slim serializer for GET (list), full nested serializer for POST (create)
        if self.request.method == "GET":
            return WorkoutListSerializer
        return WorkoutSerializer

    def perform_create(self, serializer):
        serializer.save(user_id=self.request.user.id, source="manual")


class WorkoutDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = WorkoutSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Workout.objects.filter(user_id=self.request.user.id)