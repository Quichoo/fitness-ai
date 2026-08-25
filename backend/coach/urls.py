from django.urls import path
from coach.views import ai_coach, ai_generate_workout, ai_analyze_progress, ConversationListView, ConversationDetailView

urlpatterns = [
    path("ai/coach", ai_coach, name="ai-coach"),
    path("ai/workout", ai_generate_workout, name="ai-generate-workout"),
    path("ai/analyze", ai_analyze_progress, name="ai-analyze-progress"),
    path("ai/conversations", ConversationListView.as_view(), name="ai-conversation-list"),
    path("ai/conversations/<uuid:pk>", ConversationDetailView.as_view(), name="ai-conversation-detail"),
]