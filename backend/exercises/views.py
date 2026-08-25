from rest_framework import generics, permissions
from .models import Exercise
from .serializers import ExerciseSerializer


class ExerciseListView(generics.ListAPIView):
    """Read-only: GET /api/v1/exercises - optionally filtered by ?muscle_group="""
    serializer_class = ExerciseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Exercise.objects.all()
        muscle_group = self.request.query_params.get("muscle_group")
        if muscle_group:
            queryset = queryset.filter(muscle_group=muscle_group)
        return queryset


class ExerciseDetailView(generics.RetrieveAPIView):
    """Read-only: GET /api/v1/exercises/<id>"""
    serializer_class = ExerciseSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Exercise.objects.all()