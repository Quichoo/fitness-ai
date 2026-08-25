import { useState } from "react";
import { Stack, TextInput, NumberInput, Text, Button } from "@mantine/core";
import { IconSparkles } from "@tabler/icons-react";
import { apiPost, ApiError } from "../../lib/api";
import { ActionModal } from "../shared/ActionModal";

interface GenerateWorkoutModalProps {
  opened: boolean;
  onClose: () => void;
  onGenerated: (workoutId: string) => void;
}

export function GenerateWorkoutModal({
  opened,
  onClose,
  onGenerated,
}: GenerateWorkoutModalProps) {
  const [focus, setFocus] = useState("");
  const [minutes, setMinutes] = useState<number | string>(45);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetAll = () => {
    setFocus("");
    setMinutes(45);
    setError(null);
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  const handleGenerate = async () => {
    setError(null);
    setGenerating(true);
    try {
      const workout = await apiPost("/api/v1/ai/workout", {
        focus: focus || undefined,
        available_minutes: Number(minutes) || 45,
      });
      resetAll();
      onGenerated(workout.id);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong generating your workout.",
      );
    } finally {
      setGenerating(false);
    }
  };

  return (
    <ActionModal
      opened={opened}
      onClose={handleClose}
      title="Generate a workout with AI"
      icon={<IconSparkles size={15} />}
      iconColor="grape"
      size="560px"
    >
      <Stack gap="lg">
        <Text size="md" c="gray.3" lh={1.6}>
          Your coach will build a workout using exercises from your library,
          based on your goals and recent training.
        </Text>
        <TextInput
          label="Focus (optional)"
          placeholder="e.g. upper body, legs, full body"
          value={focus}
          onChange={(e) => setFocus(e.currentTarget.value)}
          size="md"
          styles={{
            label: { color: "#e2e8f0", fontWeight: 600, marginBottom: 8 },
            input: {
              background: "rgba(15, 23, 42, 0.5)",
              borderColor: "rgba(148, 163, 184, 0.18)",
              color: "white",
              minHeight: 48,
            },
          }}
        />
        <NumberInput
          label="Available time (minutes)"
          value={minutes}
          onChange={setMinutes}
          min={10}
          max={120}
          size="md"
          styles={{
            label: { color: "#e2e8f0", fontWeight: 600, marginBottom: 8 },
            input: {
              background: "rgba(15, 23, 42, 0.5)",
              borderColor: "rgba(148, 163, 184, 0.18)",
              color: "white",
              minHeight: 48,
            },
          }}
        />
        {error && (
          <Text c="red" size="sm">
            {error}
          </Text>
        )}
        <Button
          color="grape"
          leftSection={<IconSparkles size={16} />}
          onClick={handleGenerate}
          loading={generating}
          fullWidth
          size="lg"
          mt="sm"
          style={{
            background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
            border: "none",
            minHeight: 48,
          }}
        >
          Generate workout
        </Button>
      </Stack>
    </ActionModal>
  );
}
