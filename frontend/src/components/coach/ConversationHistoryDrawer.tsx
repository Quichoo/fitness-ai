import { useEffect, useState } from "react";
import { Drawer, Stack, Text, Card, UnstyledButton } from "@mantine/core";
import { apiGet } from "../../lib/api";

interface ConversationSummary {
  id: string;
  title: string | null;
  updated_at: string;
}

interface ConversationHistoryDrawerProps {
  opened: boolean;
  onClose: () => void;
  activeConversationId: string | null;
  onSelect: (id: string) => void;
}

export function ConversationHistoryDrawer({
  opened,
  onClose,
  activeConversationId,
  onSelect,
}: ConversationHistoryDrawerProps) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);

  useEffect(() => {
    if (!opened) return;
    apiGet("/api/v1/ai/conversations")
      .then(setConversations)
      .catch(() => setConversations([]));
  }, [opened]);

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title="Chat history"
      position="right"
    >
      <Stack gap="xs">
        {conversations.length === 0 && (
          <Text c="dimmed" size="sm">
            No past conversations yet.
          </Text>
        )}
        {conversations.map((c) => (
          <UnstyledButton key={c.id} onClick={() => onSelect(c.id)}>
            <Card
              withBorder
              padding="sm"
              radius="md"
              bg={c.id === activeConversationId ? "dark.5" : undefined}
            >
              <Text size="sm" fw={500} lineClamp={1}>
                {c.title || "Untitled conversation"}
              </Text>
              <Text size="xs" c="dimmed">
                {new Date(c.updated_at).toLocaleDateString()}
              </Text>
            </Card>
          </UnstyledButton>
        ))}
      </Stack>
    </Drawer>
  );
}
