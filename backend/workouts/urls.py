from django.urls import path
from .views import WorkoutListCreateView, WorkoutDetailView

urlpatterns = [
    path("workouts", WorkoutListCreateView.as_view(), name="workout-list-create"),
    path("workouts/<uuid:pk>", WorkoutDetailView.as_view(), name="workout-detail"),
]