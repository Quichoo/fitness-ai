import { Card, Group, Text, ThemeIcon } from "@mantine/core";
import { IconSparkles, IconUser } from "@tabler/icons-react";
import type { ChatMessage } from "../../hooks/useCoachConversation";

export function MessageBubble({ role, content }: ChatMessage) {
  const isUser = role === "user";

  return (
    <Group
      align="flex-start"
      wrap="nowrap"
      justify={isUser ? "flex-end" : "flex-start"}
      style={{ width: "100%" }}
    >
      {!isUser && (
        <ThemeIcon color="grape" variant="light" size={36} radius="xl">
          <IconSparkles size={16} />
        </ThemeIcon>
      )}

      <Card
        padding="md"
        radius="lg"
        style={{
          maxWidth: "78%",
          background: isUser
            ? "linear-gradient(135deg, rgba(99, 102, 241, 0.9), rgba(139, 92, 246, 0.9))"
            : "linear-gradient(180deg, rgba(15, 23, 42, 0.9), rgba(17, 24, 39, 0.95))",
          border: isUser
            ? "1px solid rgba(165, 180, 252, 0.4)"
            : "1px solid rgba(148, 163, 184, 0.16)",
          boxShadow: "0 10px 24px rgba(15, 23, 42, 0.2)",
        }}
      >
        <Text size="sm" c={isUser ? "white" : "#e2e8f0"} style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
          {content}
        </Text>
      </Card>

      {isUser && (
        <ThemeIcon color="indigo" variant="light" size={36} radius="xl">
          <IconUser size={16} />
        </ThemeIcon>
      )}
    </Group>
  );
}
