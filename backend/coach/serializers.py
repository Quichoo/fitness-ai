from rest_framework import serializers
from coach.models import AIConversation, AIMessage


class AIMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIMessage
        fields = ["id", "role", "content", "created_at"]


class AIConversationListSerializer(serializers.ModelSerializer):
    """Slim - no messages, for the conversation list view."""

    class Meta:
        model = AIConversation
        fields = ["id", "title", "created_at", "updated_at"]


class AIConversationDetailSerializer(serializers.ModelSerializer):
    """Full - includes all messages, for viewing one conversation."""

    messages = AIMessageSerializer(many=True, read_only=True)

    class Meta:
        model = AIConversation
        fields = ["id", "title", "created_at", "updated_at", "messages"]