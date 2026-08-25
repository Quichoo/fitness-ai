import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Title,
  Text,
  Card,
  Stack,
  Group,
  SimpleGrid,
  RingProgress,
  Center,
  ThemeIcon,
  Anchor,
  Box,
  Pill,
} from "@mantine/core";
import {
  IconBarbell,
  IconTarget,
  IconFlag,
  IconClock,
  IconCalendar,
  IconArrowRight,
  IconSparkles,
  IconTemplate,
  IconBolt,
} from "@tabler/icons-react";
import { apiGet } from "../lib/api";
import { WaveBackground } from "../components/dashboard/WaveBackground";

interface Goal {
  id: string;
  category: string;
  objective: string;
  metrics: Record<string, any>;
  status: string;
}

interface WorkoutListItem {
  id: string;
  name: string;
  workout_date: string;
  duration_minutes: number | null;
  source: string;
}

const WEEKLY_WORKOUT_TARGET = 4;

const SOURCE_ICON: Record<string, { icon: typeof IconBarbell; color: string }> =
  {
    manual: { icon: IconBarbell, color: "blue" },
    ai_generated: { icon: IconSparkles, color: "grape" },
    template: { icon: IconTemplate, color: "pink" },
  };

function getStartOfWeek(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function formatWeekRange(): string {
  const start = getStartOfWeek();
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString(undefined, opts)} - ${end.toLocaleDateString(undefined, opts)}`;
}

function formatMetric(metrics: Record<string, any>): string {
  const entries = Object.entries(metrics ?? {}).filter(
    ([, v]) => v !== null && v !== "",
  );
  if (entries.length === 0) return "No specific target set";
  const [key, value] = entries[0];
  return `${key.replace(/_/g, " ")}: ${value}`;
}

export function Dashboard() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutListItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet("/api/v1/goals")
      .then(setGoals)
      .catch((err) => setError(err.message));
    apiGet("/api/v1/workouts")
      .then(setWorkouts)
      .catch((err) => setError(err.message));
  }, []);

  const realWorkouts = workouts.filter((w) => w.source !== "template"); // templates aren't "done"
  const activeGoals = goals.filter((g) => g.status === "active");
  const completedGoals = goals.filter((g) => g.status === "completed");
  const recentWorkouts = realWorkouts.slice(0, 5);
  const topActiveGoal = activeGoals[0];

  const startOfWeek = getStartOfWeek();
  const workoutsThisWeek = realWorkouts.filter(
    (w) => new Date(w.workout_date) >= startOfWeek,
  ).length;
  const weeklyPercent = Math.min(
    150,
    Math.round((workoutsThisWeek / WEEKLY_WORKOUT_TARGET) * 100),
  );

  const goalsTotal = goals.length;
  const goalsPercent =
    goalsTotal === 0
      ? 0
      : Math.round((completedGoals.length / goalsTotal) * 100);

  return (
    <div>
      <Group justify="space-between" align="flex-start" mb="xl" wrap="wrap">
        <div>
          <Title order={1} fw={700} size={32}>
            Dashboard
          </Title>
          <Text c="dimmed" size="md" mt={4}>
            Track your progress and stay consistent.
          </Text>
        </div>
        <Pill
          size="lg"
          radius="md"
          style={{ background: "var(--mantine-color-dark-6)" }}
        >
          <Group gap={6}>
            <IconCalendar size={16} />
            <Text size="sm" fw={500}>
              {formatWeekRange()}
            </Text>
          </Group>
        </Pill>
      </Group>

      {error && (
        <Text c="red" mb="md">
          {error}
        </Text>
      )}

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg" mb="xl">
        <Card
          shadow="sm"
          padding="xl"
          radius="lg"
          withBorder
          pos="relative"
          style={{ overflow: "hidden" }}
        >
          <WaveBackground color="var(--mantine-color-blue-6)" />
          <Box pos="relative">
            <ThemeIcon
              color="blue"
              variant="filled"
              size={44}
              radius="md"
              mb="md"
            >
              <IconBarbell size={22} />
            </ThemeIcon>
            <Text fw={600} size="lg">
              Workouts this week
            </Text>
            <Text size="sm" c="dimmed" mb="lg">
              {workoutsThisWeek >= WEEKLY_WORKOUT_TARGET
                ? "Great job! Keep it up."
                : "Let's get moving."}
            </Text>
            <Center>
              <RingProgress
                size={150}
                thickness={12}
                roundCaps
                sections={[
                  { value: Math.min(100, weeklyPercent), color: "blue" },
                ]}
                label={
                  <Center>
                    <Text fw={700} size="26px">
                      {workoutsThisWeek}/{WEEKLY_WORKOUT_TARGET}
                    </Text>
                  </Center>
                }
              />
            </Center>
            <Text ta="center" c="blue" fw={700} size="xl" mt="md">
              {weeklyPercent}%
            </Text>
            <Text ta="center" size="sm" c="dimmed">
              of weekly goal
            </Text>
          </Box>
        </Card>

        <Card
          shadow="sm"
          padding="xl"
          radius="lg"
          withBorder
          pos="relative"
          style={{ overflow: "hidden" }}
        >
          <WaveBackground color="var(--mantine-color-teal-6)" />
          <Box pos="relative">
            <ThemeIcon
              color="teal"
              variant="filled"
              size={44}
              radius="md"
              mb="md"
            >
              <IconTarget size={22} />
            </ThemeIcon>
            <Text fw={600} size="lg">
              Goals completed
            </Text>
            <Text size="sm" c="dimmed" mb="lg">
              {goalsPercent > 0 ? "You're on track." : "Set a goal to begin."}
            </Text>
            <Center>
              <RingProgress
                size={150}
                thickness={12}
                roundCaps
                sections={[{ value: goalsPercent, color: "teal" }]}
                label={
                  <Center>
                    <Text fw={700} size="26px">
                      {completedGoals.length}/{goalsTotal}
                    </Text>
                  </Center>
                }
              />
            </Center>
            <Text ta="center" c="teal" fw={700} size="xl" mt="md">
              {goalsPercent}%
            </Text>
            <Text ta="center" size="sm" c="dimmed">
              completed
            </Text>
          </Box>
        </Card>

        <Card
          shadow="sm"
          padding="xl"
          radius="lg"
          withBorder
          pos="relative"
          style={{ overflow: "hidden" }}
        >
          <IconFlag
            size={160}
            stroke={1}
            style={{
              position: "absolute",
              bottom: -20,
              right: -20,
              opacity: 0.06,
              color: "var(--mantine-color-grape-4)",
            }}
          />
          <Box pos="relative">
            <ThemeIcon
              color="grape"
              variant="filled"
              size={44}
              radius="md"
              mb="md"
            >
              <IconFlag size={22} />
            </ThemeIcon>
            <Text fw={600} size="lg" mb={4}>
              Active goal
            </Text>
            {topActiveGoal ? (
              <>
                <Text size="sm" c="dimmed" tt="capitalize" mb={2}>
                  {topActiveGoal.category.replace("_", " ")}
                </Text>
                <Text fw={600} size="md" mb="xl" tt="capitalize">
                  {formatMetric(topActiveGoal.metrics)}
                </Text>
              </>
            ) : (
              <Text c="dimmed" size="sm" mb="xl">
                No active goals yet.
              </Text>
            )}
            <Anchor component={Link} to="/goals" size="sm" fw={600}>
              <Group gap={4}>
                View goal
                <IconArrowRight size={14} />
              </Group>
            </Anchor>
          </Box>
        </Card>
      </SimpleGrid>

      <Card withBorder padding="xl" radius="lg">
        <Group justify="space-between" mb="lg">
          <Group gap="xs">
            <IconClock size={20} />
            <Text fw={600} size="lg">
              Recent workouts
            </Text>
          </Group>
          <Anchor component={Link} to="/workouts" size="sm" fw={600}>
            <Group gap={4}>
              View all workouts
              <IconArrowRight size={14} />
            </Group>
          </Anchor>
        </Group>

        {recentWorkouts.length === 0 ? (
          <Box ta="center" py="xl">
            <IconBarbell size={40} opacity={0.4} />
            <Text c="dimmed" size="sm" mt="sm">
              No workouts logged yet.
            </Text>
          </Box>
        ) : (
          <Stack gap="sm">
            {recentWorkouts.map((w) => {
              const meta = SOURCE_ICON[w.source] ?? SOURCE_ICON.manual;
              const SourceIcon = meta.icon;
              return (
                <Card key={w.id} padding="md" radius="md" bg="dark.6">
                  <Group justify="space-between" wrap="nowrap">
                    <Group wrap="nowrap">
                      <ThemeIcon
                        color={meta.color}
                        variant="filled"
                        size={40}
                        radius="md"
                      >
                        <SourceIcon size={20} />
                      </ThemeIcon>
                      <div>
                        <Text fw={600} size="sm">
                          {w.name}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {new Date(w.workout_date).toLocaleDateString(
                            undefined,
                            {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </Text>
                      </div>
                    </Group>
                    {w.duration_minutes && (
                      <Group gap={4}>
                        <IconClock
                          size={14}
                          color={`var(--mantine-color-${meta.color}-4)`}
                        />
                        <Text size="sm" fw={600} c={meta.color}>
                          {w.duration_minutes} MIN
                        </Text>
                      </Group>
                    )}
                  </Group>
                </Card>
              );
            })}
          </Stack>
        )}

        <Group justify="center" gap={6} mt="xl">
          <IconBolt size={16} />
          <Text ta="center" size="sm" c="dimmed">
            Keep pushing forward. Consistency today, strength tomorrow.
          </Text>
        </Group>
      </Card>
    </div>
  );
}
