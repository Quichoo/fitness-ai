import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Title,
  Text,
  Card,
  Stack,
  Badge,
  Group,
  Button,
  ThemeIcon,
  SimpleGrid,
  ActionIcon,
  Box,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconBarbell,
  IconSparkles,
  IconTemplate,
  IconCalendar,
  IconClock,
  IconTrash,
} from "@tabler/icons-react";
import { apiGet, apiDelete } from "../lib/api";

interface WorkoutSet {
  id: string;
  set_number: number;
  reps: number | null;
  weight_kg: number | null;
}

interface WorkoutExercise {
  id: string;
  exercise_id: string;
  exercise_order: number;
  sets: WorkoutSet[];
}

interface WorkoutDetailData {
  id: string;
  name: string;
  workout_date: string;
  duration_minutes: number | null;
  source: string;
  exercises: WorkoutExercise[];
}

interface Exercise {
  id: string;
  name: string;
  muscle_group: string | null;
}

const SOURCE_ICON: Record<string, { icon: typeof IconBarbell; color: string }> =
  {
    manual: { icon: IconBarbell, color: "orange" },
    ai_generated: { icon: IconSparkles, color: "grape" },
    template: { icon: IconTemplate, color: "blue" },
  };

export function WorkoutDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState<WorkoutDetailData | null>(null);
  const [exerciseMap, setExerciseMap] = useState<Record<string, Exercise>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet(`/api/v1/workouts/${id}`)
      .then(setWorkout)
      .catch((err) => setError(err.message));

    apiGet("/api/v1/exercises").then((list: Exercise[]) => {
      const map: Record<string, Exercise> = {};
      list.forEach((ex) => (map[ex.id] = ex));
      setExerciseMap(map);
    });
  }, [id]);

  const handleDelete = async () => {
    if (!workout || !confirm("Delete this workout?")) return;
    await apiDelete(`/api/v1/workouts/${workout.id}`);
    navigate("/workouts");
  };

  if (error) return <Text c="red">{error}</Text>;
  if (!workout) return <Text c="dimmed">Loading...</Text>;

  const sourceMeta = SOURCE_ICON[workout.source] ?? SOURCE_ICON.manual;
  const SourceIcon = sourceMeta.icon;

  return (
    <Box style={{ maxWidth: 1100, margin: "0 auto", padding: "8px 0 40px" }}>
      <Button
        variant="subtle"
        leftSection={<IconArrowLeft size={16} />}
        onClick={() => navigate("/workouts")}
        mb="lg"
        pl={0}
        c="gray.3"
      >
        Back to workouts
      </Button>

      <Card
        withBorder
        padding="xl"
        radius="lg"
        mb="xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.8))",
          borderColor: "rgba(148, 163, 184, 0.15)",
        }}
      >
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <Group wrap="nowrap" gap="md">
            <ThemeIcon
              color={sourceMeta.color}
              variant="filled"
              size={56}
              radius="md"
              style={{
                background:
                  sourceMeta.color === "orange"
                    ? "linear-gradient(135deg, #f59e0b, #f97316)"
                    : sourceMeta.color === "grape"
                      ? "linear-gradient(135deg, #a855f7, #7c3aed)"
                      : "linear-gradient(135deg, #60a5fa, #3b82f6)",
              }}
            >
              <SourceIcon size={28} />
            </ThemeIcon>
            <div>
              <Title order={2} c="white">
                {workout.name}
              </Title>
              <Group gap="md" mt={6}>
                <Group gap={6}>
                  <IconCalendar size={14} color="#94a3b8" />
                  <Text size="sm" c="dimmed">
                    {new Date(workout.workout_date).toLocaleDateString(
                      undefined,
                      {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      },
                    )}
                  </Text>
                </Group>
                {workout.duration_minutes && (
                  <Group gap={6}>
                    <IconClock size={14} color="#94a3b8" />
                    <Text size="sm" c="dimmed">
                      {workout.duration_minutes} min
                    </Text>
                  </Group>
                )}
              </Group>
            </div>
          </Group>
          <Group gap="xs">
            <Badge variant="filled" color={sourceMeta.color} size="lg">
              {workout.source.replace("_", " ")}
            </Badge>
            <ActionIcon
              color="red"
              variant="subtle"
              size="lg"
              onClick={handleDelete}
              aria-label={`Delete workout: ${workout.name}`}
              style={{ color: "#fca5a5" }}
            >
              <IconTrash size={18} />
            </ActionIcon>
          </Group>
        </Group>
      </Card>

      <Title order={3} fw={700} mb="md" c="white">
        Exercises
      </Title>

      {workout.exercises.length === 0 ? (
        <Text c="dimmed" size="sm">
          No exercises logged for this workout.
        </Text>
      ) : (
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          {workout.exercises.map((ex) => {
            const exerciseInfo = exerciseMap[ex.exercise_id];
            return (
              <Card
                key={ex.id}
                withBorder
                padding="lg"
                radius="lg"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(30, 41, 59, 0.8))",
                  borderColor: "rgba(148, 163, 184, 0.15)",
                }}
              >
                <Group mb="md">
                  <ThemeIcon
                    color="indigo"
                    variant="filled"
                    size="lg"
                    radius="md"
                    style={{
                      background: "linear-gradient(135deg, #60a5fa, #3b82f6)",
                    }}
                  >
                    <IconBarbell size={18} />
                  </ThemeIcon>
                  <div>
                    <Text fw={600} c="white">{exerciseInfo?.name || "Exercise"}</Text>
                    {exerciseInfo?.muscle_group && (
                      <Text size="xs" c="dimmed" tt="capitalize">
                        {exerciseInfo.muscle_group}
                      </Text>
                    )}
                  </div>
                </Group>
                <Stack gap={6}>
                  {ex.sets.map((set) => (
                    <Group key={set.id} justify="space-between" py={4}>
                      <Text size="sm" c="dimmed">
                        Set {set.set_number}
                      </Text>
                      <Text size="sm" fw={500} c="white">
                        {set.reps ?? "—"} reps @ {set.weight_kg ?? "—"} kg
                      </Text>
                    </Group>
                  ))}
                </Stack>
              </Card>
            );
          })}
        </SimpleGrid>
      )}
    </Box>
  );
}
