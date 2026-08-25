import { useState, useEffect } from "react";
import {
  Stack,
  TextInput,
  Group,
  Card,
  Select,
  Text,
  ActionIcon,
  Button,
  Divider,
  Loader,
} from "@mantine/core";
import { IconTrash, IconPlus, IconBarbell } from "@tabler/icons-react";
import { apiPost, apiGet } from "../../lib/api";
import { useDraftExercises } from "../../hooks/useDraftExercises";
import { ActionModal } from "../shared/ActionModal";

interface Exercise {
  id: string;
  name: string;
}

interface LogWorkoutModalProps {
  opened: boolean;
  onClose: () => void;
  onCreated: () => void;
  exerciseOptions: Exercise[];
  prefillFromWorkoutId?: string | null;
}

export function LogWorkoutModal({
  opened,
  onClose,
  onCreated,
  exerciseOptions,
  prefillFromWorkoutId,
}: LogWorkoutModalProps) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [duration, setDuration] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadingPrefill, setLoadingPrefill] = useState(false);
  const draft = useDraftExercises();

  const selectOptions = exerciseOptions.map((ex) => ({
    value: ex.id,
    label: ex.name,
  }));

  useEffect(() => {
    if (!opened || !prefillFromWorkoutId) return;

    setLoadingPrefill(true);
    apiGet(`/api/v1/workouts/${prefillFromWorkoutId}`)
      .then((full) => {
        setName(full.name);
        setDate(new Date().toISOString().slice(0, 10)); // today, not the template's original date
        setDuration(full.duration_minutes ? String(full.duration_minutes) : "");
        draft.loadFrom(
          full.exercises.map((ex: any) => ({
            exercise_id: ex.exercise_id,
            sets: ex.sets.map((s: any) => ({
              reps: s.reps != null ? String(s.reps) : "",
              weight_kg: s.weight_kg != null ? String(s.weight_kg) : "",
            })),
          })),
        );
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingPrefill(false));
  }, [opened, prefillFromWorkoutId]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetAll = () => {
    setName("");
    setDate("");
    setDuration("");
    setError(null);
    draft.reset();
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const validExercises = draft.exercises.filter((ex) => ex.exercise_id);

    try {
      await apiPost("/api/v1/workouts", {
        name,
        workout_date: date,
        duration_minutes: duration ? Number(duration) : null,
        exercises: validExercises.map((ex, index) => ({
          exercise_id: ex.exercise_id,
          exercise_order: index + 1,
          sets: ex.sets.map((s, setIndex) => ({
            set_number: setIndex + 1,
            reps: s.reps ? Number(s.reps) : null,
            weight_kg: s.weight_kg ? Number(s.weight_kg) : null,
          })),
        })),
      });
      resetAll();
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <ActionModal
      opened={opened}
      onClose={handleClose}
      title={prefillFromWorkoutId ? "Log this workout" : "Log a workout"}
      icon={<IconBarbell size={15} />}
      iconColor="orange"
      size="720px"
    >
      {loadingPrefill ? (
        <Group justify="center" py="xl">
          <Loader size="sm" />
        </Group>
      ) : (
        <form onSubmit={handleSubmit}>
          <Stack gap="lg">
            <TextInput
              label="Workout name"
              size="md"
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
              required
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
            <Group grow>
              <TextInput
                label="Date"
                type="date"
                size="md"
                value={date}
                onChange={(e) => setDate(e.currentTarget.value)}
                required
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
              <TextInput
                label="Duration (minutes)"
                size="md"
                value={duration}
                onChange={(e) => setDuration(e.currentTarget.value)}
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
            </Group>

            {draft.exercises.map((ex, exIndex) => (
              <Card
                key={exIndex}
                withBorder
                padding="md"
                radius="md"
                style={{
                  background: "rgba(15, 23, 42, 0.5)",
                  borderColor: "rgba(148, 163, 184, 0.18)",
                }}
              >
                <Stack gap="sm">
                  <Select
                    label="Exercise"
                    placeholder="Select exercise"
                    size="md"
                    data={selectOptions}
                    value={ex.exercise_id}
                    onChange={(value) => draft.updateExercise(exIndex, value)}
                    searchable
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
                  {ex.sets.map((set, setIndex) => (
                    <Group key={setIndex} gap="xs" wrap="nowrap">
                      <Text size="sm" c="dimmed" w={20}>
                        {setIndex + 1}
                      </Text>
                      <TextInput
                        placeholder="Reps"
                        size="md"
                        value={set.reps}
                        onChange={(e) =>
                          draft.updateSet(
                            exIndex,
                            setIndex,
                            "reps",
                            e.currentTarget.value,
                          )
                        }
                        style={{ flex: 1 }}
                        styles={{
                          input: {
                            background: "rgba(15, 23, 42, 0.5)",
                            borderColor: "rgba(148, 163, 184, 0.18)",
                            color: "white",
                            minHeight: 48,
                          },
                        }}
                      />
                      <TextInput
                        placeholder="Weight (kg)"
                        size="md"
                        value={set.weight_kg}
                        onChange={(e) =>
                          draft.updateSet(
                            exIndex,
                            setIndex,
                            "weight_kg",
                            e.currentTarget.value,
                          )
                        }
                        style={{ flex: 1 }}
                        styles={{
                          input: {
                            background: "rgba(15, 23, 42, 0.5)",
                            borderColor: "rgba(148, 163, 184, 0.18)",
                            color: "white",
                            minHeight: 48,
                          },
                        }}
                      />
                      {ex.sets.length > 1 && (
                        <ActionIcon
                          color="red"
                          variant="subtle"
                          onClick={() => draft.removeSet(exIndex, setIndex)}
                          aria-label={`Remove set ${setIndex + 1}`}
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      )}
                    </Group>
                  ))}
                  <Group justify="space-between">
                    <Button
                      size="sm"
                      variant="light"
                      leftSection={<IconPlus size={14} />}
                      onClick={() => draft.addSet(exIndex)}
                    >
                      Add set
                    </Button>
                    {draft.exercises.length > 1 && (
                      <Button
                        size="sm"
                        color="red"
                        variant="subtle"
                        onClick={() => draft.removeExercise(exIndex)}
                      >
                        Remove exercise
                      </Button>
                    )}
                  </Group>
                </Stack>
              </Card>
            ))}

            <Button
              variant="light"
              leftSection={<IconPlus size={14} />}
              onClick={draft.addExercise}
              size="md"
              fullWidth
              style={{
                minHeight: 48,
                background: "rgba(59,130,246,0.14)",
                border: "1px solid rgba(96,165,250,0.28)",
              }}
            >
              Add exercise
            </Button>

            <Divider />
            {error && (
              <Text c="red" size="sm">
                {error}
              </Text>
            )}
            <Button
              type="submit"
              size="lg"
              fullWidth
              style={{
                background: "linear-gradient(135deg, #3b82f6, #4f46e5)",
                border: "none",
                minHeight: 48,
              }}
            >
              Save workout
            </Button>
          </Stack>
        </form>
      )}
    </ActionModal>
  );
}
