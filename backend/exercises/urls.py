from django.urls import path
from .views import ExerciseListView, ExerciseDetailView

urlpatterns = [
    path("exercises", ExerciseListView.as_view(), name="exercise-list"),
    path("exercises/<uuid:pk>", ExerciseDetailView.as_view(), name="exercise-detail"),
]