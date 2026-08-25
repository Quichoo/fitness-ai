import { useRef, useEffect } from "react";
import {
  Title,
  Text,
  Card,
  Stack,
  Group,
  Textarea,
  Button,
  ThemeIcon,
  ScrollArea,
  Loader,
  Alert,
  Box,
} from "@mantine/core";
import {
  IconSparkles,
  IconSend,
  IconAlertCircle,
  IconHistory,
  IconPlus,
} from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { useCoachConversation } from "../hooks/useCoachConversation";
import { MessageBubble } from "../components/coach/MessageBubble";
import { ConversationHistoryDrawer } from "../components/coach/ConversationHistoryDrawer";

export function Coach() {
  const coach = useCoachConversation();
  const [input, setInput] = useState("");
  const [historyOpened, { open: openHistory, close: closeHistory }] =
    useDisclosure(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [coach.messages, coach.loading]);

  const canSend = input.trim().length > 0 && !coach.loading && !coach.loadingHistory;

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || !canSend) return;
    setInput("");
    coach.sendMessage(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectConversation = (id: string) => {
    closeHistory();
    coach.switchToConversation(id);
  };

  return (
    <Box style={{ maxWidth: 1280, margin: "0 auto", width: "100%" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "calc(100vh - 100px)",
        }}
      >
        <Group justify="space-between" mb="xs" align="flex-start" wrap="wrap">
          <Group gap="sm" align="flex-start">
            <ThemeIcon color="grape" variant="filled" size={52} radius="lg">
              <IconSparkles size={22} />
            </ThemeIcon>
            <div>
              <Title order={1} fw={700} size={46} c="white">
                AI Coach
              </Title>
              <Text c="dimmed" size="sm" mt={6}>
                Ask about your goals, workouts, or training progress.
              </Text>
            </div>
          </Group>
          <Group gap="xs">
            <Button
              variant="default"
              leftSection={<IconPlus size={16} />}
              onClick={coach.startNewConversation}
              style={{
                background: "rgba(15, 23, 42, 0.7)",
                border: "1px solid rgba(148,163,184,0.2)",
                color: "#e2e8f0",
              }}
            >
              New chat
            </Button>
            <Button
              variant="default"
              leftSection={<IconHistory size={16} />}
              onClick={openHistory}
              style={{
                background: "rgba(15, 23, 42, 0.7)",
                border: "1px solid rgba(148,163,184,0.2)",
                color: "#e2e8f0",
              }}
            >
              History
            </Button>
          </Group>
        </Group>

        <ScrollArea
          style={{
            flex: 1,
            background: "rgba(15, 23, 42, 0.6)",
            border: "1px solid rgba(148, 163, 184, 0.12)",
            borderRadius: 22,
            padding: 12,
          }}
          viewportRef={scrollRef}
          mt="md"
        >
          <Stack gap="md" pb="md">
            {coach.loadingHistory && (
              <Group justify="center" py="xl">
                <Loader size="sm" color="grape" />
              </Group>
            )}

            {!coach.loadingHistory && coach.messages.length === 0 && (
              <Card
                withBorder
                padding="xl"
                radius="lg"
                ta="center"
                style={{
                  background: "linear-gradient(180deg, rgba(17,24,39,0.8), rgba(15,23,42,0.9))",
                  border: "1px solid rgba(148,163,184,0.16)",
                }}
              >
                <ThemeIcon
                  color="grape"
                  variant="light"
                  size={52}
                  radius="xl"
                  mx="auto"
                  mb="sm"
                >
                  <IconSparkles size={24} />
                </ThemeIcon>
                <Text fw={700} c="white">Ask your AI coach anything</Text>
                <Text size="sm" c="dimmed" mt={8}>
                  "How is my strength training progressing?" or "What should I
                  focus on next?"
                </Text>
              </Card>
            )}

            {coach.messages.map((msg, i) => (
              <MessageBubble key={i} role={msg.role} content={msg.content} />
            ))}

            {coach.loading && (
              <Group gap="xs">
                <ThemeIcon color="grape" variant="light" size="md" radius="xl">
                  <IconSparkles size={14} />
                </ThemeIcon>
                <Loader size="sm" color="grape" />
              </Group>
            )}
          </Stack>
        </ScrollArea>

        {coach.error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            color="red"
            mt="sm"
            onClose={coach.clearError}
            withCloseButton
          >
            {coach.error}
          </Alert>
        )}

        <Group mt="md" align="flex-end" gap="xs">
          <Textarea
            placeholder="Ask your coach a question..."
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            autosize
            minRows={1}
            maxRows={4}
            style={{ flex: 1 }}
            disabled={coach.loading || coach.loadingHistory}
            radius="lg"
            styles={{
              input: {
                background: "rgba(15, 23, 42, 0.72)",
                border: "1px solid rgba(148,163,184,0.16)",
                color: "#f8fafc",
                padding: "14px 16px",
              },
            }}
          />
          <Button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            leftSection={<IconSend size={16} />}
            style={{
              background: canSend
                ? "linear-gradient(135deg, #8b5cf6, #ec4899)"
                : "rgba(71, 85, 105, 0.5)",
              border: "none",
              boxShadow: canSend ? "0 12px 24px rgba(168, 85, 247, 0.35)" : "none",
              cursor: canSend ? "pointer" : "not-allowed",
              opacity: canSend ? 1 : 0.7,
            }}
          >
            Send
          </Button>
        </Group>

        <ConversationHistoryDrawer
          opened={historyOpened}
          onClose={closeHistory}
          activeConversationId={coach.conversationId}
          onSelect={handleSelectConversation}
        />
      </div>
    </Box>
  );
}
