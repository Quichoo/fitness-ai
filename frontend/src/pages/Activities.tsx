import { useEffect, useState } from "react";
import { Title, Text, Group, Button, Stack, SimpleGrid, Box } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { apiGet, apiDelete } from "../lib/api";
import { ActivityCard } from "../components/activities/ActivityCard";
import { LogActivityModal } from "../components/activities/LogActivityModal";

interface ActivityItem {
  id: string;
  activity_type: string;
  activity_date: string;
  distance_km: number | null;
  duration_minutes: number | null;
  avg_pace_min_per_km: number | null;
  avg_speed_kmh: number | null;
  elevation_gain_m: number | null;
  avg_heart_rate: number | null;
  notes: string | null;
}

function monthLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export function Activities() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [formOpened, { open: openForm, close: closeForm }] =
    useDisclosure(false);

  const loadActivities = () => {
    apiGet("/api/v1/activities")
      .then(setActivities)
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this activity?")) return;
    await apiDelete(`/api/v1/activities/${id}`);
    loadActivities();
  };

  const grouped = activities.reduce<Record<string, ActivityItem[]>>(
    (acc, a) => {
      const label = monthLabel(a.activity_date);
      if (!acc[label]) acc[label] = [];
      acc[label].push(a);
      return acc;
    },
    {},
  );
  const monthOrder = Array.from(
    new Set(activities.map((a) => monthLabel(a.activity_date))),
  );

  return (
    <Box style={{ maxWidth: 1280, margin: "0 auto", padding: "8px 0 40px" }}>
      <Group justify="space-between" align="flex-start" mb="lg" wrap="wrap">
        <div>
          <Title order={1} fw={700} size={46} c="white">
            Activities
          </Title>
          <Text c="dimmed" size="sm" mt={6}>
            Log your runs, rides, and walks.
          </Text>
        </div>

        <Button
          size="md"
          leftSection={<IconPlus size={18} />}
          onClick={openForm}
          style={{
            background: "linear-gradient(135deg, #3b82f6, #4f46e5)",
            border: "none",
          }}
        >
          Log activity
        </Button>
      </Group>

      {error && (
        <Text c="red" mb="md">
          {error}
        </Text>
      )}
      {activities.length === 0 && (
        <Text c="dimmed" size="sm">
          No activities logged yet.
        </Text>
      )}

      <Stack gap="xl">
        {monthOrder.map((month) => (
          <div key={month}>
            <Title order={3} fw={700} mb="md" c="white">
              {month}
            </Title>
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
              {grouped[month].map((a) => (
                <ActivityCard key={a.id} activity={a} onDelete={handleDelete} />
              ))}
            </SimpleGrid>
          </div>
        ))}
      </Stack>

      <LogActivityModal
        opened={formOpened}
        onClose={closeForm}
        onCreated={loadActivities}
      />
    </Box>
  );
}
