import {
  Card,
  Group,
  ThemeIcon,
  Title,
  Text,
  Button,
  Stack,
} from "@mantine/core";
import type { IconRun } from "@tabler/icons-react";

interface TrendData {
  avg_pace_min_per_km: number | null;
  total_distance_km: number;
  activity_count: number;
}

interface TrendCardProps {
  title: string;
  icon: typeof IconRun;
  color: string;
  trend: TrendData;
}

export function TrendCard({ title, icon: Icon, color, trend }: TrendCardProps) {
  const formatPace = (pace: number | null) => {
    if (pace === null) return "—";

    const minutes = Math.floor(pace);
    const seconds = Math.round((pace - minutes) * 60);

    return `${minutes}:${seconds.toString().padStart(2, "0")} min/km`;
  };

  return (
    <Card
      padding="lg"
      radius="lg"
      withBorder
      style={{
        background:
          "linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.8))",
        borderColor: "rgba(148, 163, 184, 0.16)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      <Group justify="space-between" align="center" mb="lg">
        <Group gap="sm">
          <ThemeIcon
            color={color}
            variant="filled"
            size={36}
            radius="md"
            style={{
              background:
                color === "lime"
                  ? "linear-gradient(135deg, #4ade80, #16a34a)"
                  : "linear-gradient(135deg, #22d3ee, #0ea5e9)",
            }}
          >
            <Icon size={20} />
          </ThemeIcon>

          <Title order={3} fw={700} size={28} c="white">
            {title}
          </Title>
        </Group>

        <Button
          variant="default"
          size="compact-sm"
          style={{
            borderColor: "rgba(148, 163, 184, 0.18)",
            color: "#e2e8f0",
            background: "rgba(148,163,184,0.04)",
          }}
        >
          View details
        </Button>
      </Group>

      {trend.activity_count === 0 ? (
        <Text c="dimmed" size="sm">
          No activities logged in the last 30 days.
        </Text>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 24,
              alignItems: "end",
              marginBottom: 16,
            }}
          >
            <Stack gap={2}>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                Total distance
              </Text>

              <Text fw={700} size="xl" c="white">
                {trend.total_distance_km} km
              </Text>
            </Stack>

            <Stack gap={2}>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                Avg pace
              </Text>

              <Text fw={700} size="xl" c="white">
                {formatPace(trend.avg_pace_min_per_km)}
              </Text>
            </Stack>
          </div>

          <div
            style={{
              height: 60,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <svg
              viewBox="0 0 600 80"
              preserveAspectRatio="none"
              width="100%"
              height="100%"
            >
              <defs>
                <linearGradient
                  id={`${color}-gradient`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={color === "lime" ? "#4ade80" : "#22d3ee"}
                    stopOpacity="0.28"
                  />
                  <stop
                    offset="100%"
                    stopColor={color === "lime" ? "#4ade80" : "#22d3ee"}
                    stopOpacity="0"
                  />
                </linearGradient>
              </defs>

              <path
                d="M0 55
                   C40 45, 55 48, 85 32
                   C115 18, 135 42, 165 45
                   C200 48, 210 28, 245 36
                   C280 45, 295 51, 325 42
                   C355 33, 375 22, 405 30
                   C435 38, 450 50, 480 39
                   C515 26, 530 35, 555 23
                   C575 14, 590 20, 600 15
                   L600 80
                   L0 80 Z"
                fill={`url(#${color}-gradient)`}
              />

              <path
                d="M0 55
                   C40 45, 55 48, 85 32
                   C115 18, 135 42, 165 45
                   C200 48, 210 28, 245 36
                   C280 45, 295 51, 325 42
                   C355 33, 375 22, 405 30
                   C435 38, 450 50, 480 39
                   C515 26, 530 35, 555 23
                   C575 14, 590 20, 600 15"
                fill="none"
                stroke={color === "lime" ? "#4ade80" : "#22d3ee"}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </>
      )}
    </Card>
  );
}
