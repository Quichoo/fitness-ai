from django.urls import path
from progress.views import progress_summary

urlpatterns = [
    path("progress", progress_summary, name="progress-summary"),
]