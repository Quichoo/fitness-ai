import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Title,
  Text,
  Group,
  Select,
  TextInput,
  Button,
  Stack,
  SimpleGrid,
  Box,
} from "@mantine/core";
import { IconPlus, IconSearch, IconSparkles } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { apiGet, apiDelete } from "../lib/api";
import { WorkoutCard } from "../components/workouts/WorkoutCard";
import { LogWorkoutModal } from "../components/workouts/LogWorkoutModal";
import { GenerateWorkoutModal } from "../components/workouts/GenerateWorkoutModal";

interface WorkoutListItem {
  id: string;
  name: string;
  workout_date: string;
  duration_minutes: number | null;
  source: string;
  is_template: boolean;
}

interface Exercise {
  id: string;
  name: string;
}

function monthLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export function Workouts() {
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState<WorkoutListItem[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string | null>("");
  const [prefillWorkoutId, setPrefillWorkoutId] = useState<string | null>(null);

  const [logModalOpened, { open: openLogModal, close: closeLogModal }] =
    useDisclosure(false);
  const [aiModalOpened, { open: openAiModal, close: closeAiModal }] =
    useDisclosure(false);

  const loadWorkouts = () => {
    apiGet("/api/v1/workouts")
      .then(setWorkouts)
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    loadWorkouts();
    apiGet("/api/v1/exercises")
      .then(setExercises)
      .catch((err) => setError(err.message));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this workout?")) return;
    await apiDelete(`/api/v1/workouts/${id}`);
    loadWorkouts();
  };

  const handleAiGenerated = (workoutId: string) => {
    closeAiModal();
    loadWorkouts();
    navigate(`/workouts/${workoutId}`);
  };

  const handleLogAgain = (workout: WorkoutListItem) => {
    setPrefillWorkoutId(workout.id);
    openLogModal();
  };

  const filtered = workouts.filter((w) => {
    const matchesSearch = w.name.toLowerCase().includes(search.toLowerCase());
    const matchesSource = !sourceFilter || w.source === sourceFilter;
    return matchesSearch && matchesSource;
  });

  const grouped = filtered.reduce<Record<string, WorkoutListItem[]>>(
    (acc, w) => {
      const label = monthLabel(w.workout_date);
      if (!acc[label]) acc[label] = [];
      acc[label].push(w);
      return acc;
    },
    {},
  );
  const monthOrder = Array.from(
    new Set(filtered.map((w) => monthLabel(w.workout_date))),
  );

  return (
    <Box style={{ maxWidth: 1280, margin: "0 auto", padding: "8px 0 40px" }}>
      <Group justify="space-between" align="flex-start" mb="lg" wrap="wrap">
        <div>
          <Title order={1} fw={700} size={46} c="white">
            Workouts
          </Title>
          <Text c="dimmed" size="sm" mt={6}>
            Browse and log your training history.
          </Text>
        </div>

        <Group gap="xs">
          <Button
            size="md"
            variant="default"
            leftSection={<IconSparkles size={18} />}
            onClick={openAiModal}
            style={{
              borderColor: "rgba(148, 163, 184, 0.2)",
              color: "#e2e8f0",
              background: "rgba(148,163,184,0.04)",
            }}
          >
            Generate with AI
          </Button>
          <Button
            size="md"
            leftSection={<IconPlus size={18} />}
            onClick={openLogModal}
            style={{
              background: "linear-gradient(135deg, #3b82f6, #4f46e5)",
              border: "none",
            }}
          >
            Log workout
          </Button>
        </Group>
      </Group>

      <Group mb="xl" grow>
        <TextInput
          placeholder="Search workouts..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          size="md"
          styles={{
            input: {
              background: "rgba(15, 23, 42, 0.5)",
              borderColor: "rgba(148, 163, 184, 0.18)",
              color: "white",
            },
          }}
        />
        <Select
          placeholder="All sources"
          data={[
            { value: "manual", label: "Manual" },
            { value: "ai_generated", label: "AI generated" },
            { value: "template", label: "Template" },
          ]}
          value={sourceFilter}
          onChange={setSourceFilter}
          clearable
          size="md"
          styles={{
            input: {
              background: "rgba(15, 23, 42, 0.5)",
              borderColor: "rgba(148, 163, 184, 0.18)",
              color: "white",
            },
          }}
        />
      </Group>

      {error && (
        <Text c="red" mb="md">
          {error}
        </Text>
      )}
      {filtered.length === 0 && (
        <Text c="dimmed" size="sm">
          No workouts found.
        </Text>
      )}

      <Stack gap="xl">
        {monthOrder.map((month) => (
          <div key={month}>
            <Title order={3} fw={700} mb="md" c="white">
              {month}
            </Title>
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
              {grouped[month].map((w) => (
                <WorkoutCard
                  key={w.id}
                  workout={w}
                  onDelete={handleDelete}
                  onLogAgain={handleLogAgain}
                />
              ))}
            </SimpleGrid>
          </div>
        ))}
      </Stack>

      <LogWorkoutModal
        opened={logModalOpened}
        onClose={() => {
          closeLogModal();
          setPrefillWorkoutId(null);
        }}
        onCreated={loadWorkouts}
        exerciseOptions={exercises}
        prefillFromWorkoutId={prefillWorkoutId}
      />
      <GenerateWorkoutModal
        opened={aiModalOpened}
        onClose={closeAiModal}
        onGenerated={handleAiGenerated}
      />
    </Box>
  );
}
