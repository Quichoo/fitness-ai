import { useEffect, useRef, useState } from "react";
import { apiGet, apiPost, ApiError } from "../lib/api";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const STORAGE_KEY = "fitness-ai-active-conversation";

/**
 * Owns all state and logic for a coach conversation: which conversation
 * is active, its messages, sending a new message, and switching between
 * conversations. Consolidates what would otherwise be 6+ separate
 * useState calls in the page component itself.
 */
export function useCoachConversation() {
  const [conversationId, setConversationId] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY),
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedInitial = useRef(false);

  useEffect(() => {
    if (hasLoadedInitial.current || !conversationId) return;
    hasLoadedInitial.current = true;
    setLoadingHistory(true);
    apiGet(`/api/v1/ai/conversations/${conversationId}`)
      .then((data) =>
        setMessages(
          data.messages.map((m: any) => ({ role: m.role, content: m.content })),
        ),
      )
      .catch(() => {
        localStorage.removeItem(STORAGE_KEY);
        setConversationId(null);
      })
      .finally(() => setLoadingHistory(false));
  }, [conversationId]);

  const sendMessage = async (text: string) => {
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);
    try {
      const response = await apiPost("/api/v1/ai/coach", {
        message: text,
        conversation_id: conversationId,
      });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.reply },
      ]);
      if (!conversationId) {
        setConversationId(response.conversation_id);
        localStorage.setItem(STORAGE_KEY, response.conversation_id);
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const switchToConversation = async (id: string) => {
    setLoadingHistory(true);
    setError(null);
    try {
      const data = await apiGet(`/api/v1/ai/conversations/${id}`);
      setMessages(
        data.messages.map((m: any) => ({ role: m.role, content: m.content })),
      );
      setConversationId(id);
      localStorage.setItem(STORAGE_KEY, id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  const startNewConversation = () => {
    setConversationId(null);
    setMessages([]);
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    conversationId,
    messages,
    loading,
    loadingHistory,
    error,
    clearError: () => setError(null),
    sendMessage,
    switchToConversation,
    startNewConversation,
  };
}
