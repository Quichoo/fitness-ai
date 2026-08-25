import { useEffect, useState } from "react";
import { Title, Text, SimpleGrid, Stack, Group, Box } from "@mantine/core";
import { IconRun, IconBike, IconCalendar } from "@tabler/icons-react";

import { apiGet } from "../lib/api";
import { OneRepMaxCard } from "../components/progress/OneRepMaxCard";
import { TrendCard } from "../components/progress/TrendCard";
import { AIAnalysisPanel } from "../components/progress/AIAnalysisPanel";

interface ProgressStats {
  weekly_workout_frequency: number;

  one_rep_maxes: {
    exercise_name: string;
    estimated_1rm_kg: number;
  }[];

  running_trends: {
    avg_pace_min_per_km: number | null;
    total_distance_km: number;
    activity_count: number;
  };

  cycling_trends: {
    avg_pace_min_per_km: number | null;
    total_distance_km: number;
    activity_count: number;
  };
}

export function Progress() {
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet("/api/v1/progress")
      .then(setStats)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <Text c="red">Unable to load progress: {error}</Text>;
  }

  if (!stats) {
    return <Text c="dimmed">Loading...</Text>;
  }

  return (
    <Box style={{ maxWidth: 1280, margin: "0 auto", padding: "8px 0 40px" }}>
      <Group justify="space-between" align="flex-start" wrap="wrap" mb="lg">
        <div>
          <Title order={1} size={46} fw={700} c="white">
            Progress
          </Title>
          <Text c="dimmed" size="sm" mt={6}>
            Real stats from your training, explained by your coach.
          </Text>
        </div>

        <Group
          gap={8}
          style={{
            border: "1px solid rgba(148, 163, 184, 0.2)",
            background: "rgba(15, 23, 42, 0.7)",
            borderRadius: 12,
            padding: "8px 12px",
          }}
        >
          <IconCalendar size={16} color="#dbeafe" />
          <Text size="sm" fw={500} c="gray.2">
            May 18 – May 24, 2025
          </Text>
        </Group>
      </Group>

      <Box mb="xl">
        <Text size="xs" c="dimmed" tt="uppercase" fw={700} lts={1.2}>
          This week
        </Text>
        <Title order={2} size={38} fw={700} mt={6} c="white">
          {stats.weekly_workout_frequency} workouts
        </Title>
      </Box>

      <Stack gap="lg">
        <OneRepMaxCard oneRepMaxes={stats.one_rep_maxes} />

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
          <TrendCard
            title="Running (30 days)"
            icon={IconRun}
            color="lime"
            trend={stats.running_trends}
          />

          <TrendCard
            title="Cycling (30 days)"
            icon={IconBike}
            color="cyan"
            trend={stats.cycling_trends}
          />
        </SimpleGrid>

        <AIAnalysisPanel />
      </Stack>
    </Box>
  );
}
