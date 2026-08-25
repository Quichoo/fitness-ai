import {
  Card,
  Group,
  ThemeIcon,
  Title,
  Text,
  Button,
  Loader,
  Alert,
} from "@mantine/core";
import { IconSparkles, IconAlertCircle } from "@tabler/icons-react";
import { useState } from "react";
import { apiPost, ApiError } from "../../lib/api";

export function AIAnalysisPanel() {
  const [explanation, setExplanation] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [asked, setAsked] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiPost("/api/v1/ai/analyze", {});

      setAsked(true);

      setExplanation(
        response.explanation ??
          "The AI explanation isn't available right now, but your stats above are still accurate.",
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      withBorder
      padding="xl"
      radius="lg"
      style={{
        border: "1px solid rgba(168, 85, 247, 0.28)",
        background:
          "linear-gradient(135deg, rgba(23, 15, 42, 0.92), rgba(46, 16, 72, 0.82))",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      <Group justify="space-between" align="flex-start" gap="lg">
        <Group gap="sm" align="flex-start">
          <ThemeIcon
            color="grape"
            variant="filled"
            size={42}
            radius="md"
            style={{
              background: "linear-gradient(135deg, #a855f7, #7c3aed)",
            }}
          >
            <IconSparkles size={20} />
          </ThemeIcon>

          <div>
            <Title order={3} fw={700} size={28} c="white">
              Coach's take
            </Title>

            <Text c="dimmed" size="sm" mt={4}>
              Get a plain-language summary of your progress from your AI coach.
            </Text>
          </div>
        </Group>

        {!asked && !loading && (
          <Button
            size="lg"
            leftSection={<IconSparkles size={18} />}
            onClick={handleAnalyze}
            style={{
              background: "linear-gradient(135deg, #8b5cf6, #a855f7)",
              border: "none",
              boxShadow: "none",
              minWidth: 220,
            }}
          >
            Explain my progress
          </Button>
        )}
      </Group>

      {loading && (
        <Group gap="xs" mt="lg">
          <Loader size="sm" color="grape" />
          <Text size="sm" c="dimmed">
            Analyzing your stats...
          </Text>
        </Group>
      )}

      {error && (
        <Alert mt="lg" icon={<IconAlertCircle size={16} />} color="red">
          {error}
        </Alert>
      )}

      {explanation && (
        <Text
          mt="lg"
          size="sm"
          c="gray.2"
          style={{
            whiteSpace: "pre-wrap",
            lineHeight: 1.7,
          }}
        >
          {explanation}
        </Text>
      )}
    </Card>
  );
}
