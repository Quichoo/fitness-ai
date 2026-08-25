import { Card, Text, Group, ThemeIcon, ActionIcon, Menu, Box } from "@mantine/core";
import {
  IconRun,
  IconBike,
  IconWalk,
  IconCalendar,
  IconDots,
  IconTrash,
} from "@tabler/icons-react";

interface ActivityItem {
  id: string;
  activity_type: string;
  activity_date: string;
  distance_km: number | null;
  duration_minutes: number | null;
  avg_pace_min_per_km: number | null;
  avg_speed_kmh: number | null;
  elevation_gain_m: number | null;
}

const TYPE_META: Record<string, { icon: typeof IconRun; color: string; accent: string }> = {
  running: { icon: IconRun, color: "lime", accent: "#84cc16" },
  cycling: { icon: IconBike, color: "cyan", accent: "#22d3ee" },
  walking: { icon: IconWalk, color: "teal", accent: "#2dd4bf" },
};

interface ActivityCardProps {
  activity: ActivityItem;
  onDelete: (id: string) => void;
}

export function ActivityCard({ activity, onDelete }: ActivityCardProps) {
  const meta = TYPE_META[activity.activity_type] ?? TYPE_META.running;
  const TypeIcon = meta.icon;

  const details = [
    activity.distance_km && `${activity.distance_km} km`,
    activity.duration_minutes && `${activity.duration_minutes} min`,
    activity.avg_pace_min_per_km && `${activity.avg_pace_min_per_km} min/km`,
    activity.avg_speed_kmh && `${activity.avg_speed_kmh} km/h`,
    activity.elevation_gain_m && `${activity.elevation_gain_m} m gain`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card
      padding="lg"
      radius="lg"
      style={{
        background: "linear-gradient(180deg, rgba(17,24,39,0.78), rgba(15,23,42,0.92))",
        border: "1px solid rgba(148, 163, 184, 0.18)",
        boxShadow: "0 12px 30px rgba(15, 23, 42, 0.28)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        style={{
          position: "absolute",
          inset: 0,
          width: 4,
          background: `linear-gradient(180deg, ${meta.accent}, rgba(255,255,255,0.2))`,
          borderRadius: 12,
        }}
      />

      <Group justify="space-between" align="flex-start" wrap="nowrap" style={{ paddingLeft: 12 }}>
        <Group wrap="nowrap" gap="md">
          <ThemeIcon color={meta.color} variant="light" size={48} radius="lg" style={{ background: "rgba(15, 118, 110, 0.15)" }}>
            <TypeIcon size={24} />
          </ThemeIcon>
          <div>
            <Text fw={700} size="lg" tt="capitalize" c="white">
              {activity.activity_type}
            </Text>
            <Group gap={6} mt={4}>
              <IconCalendar size={14} opacity={0.6} color="#cbd5e1" />
              <Text size="sm" c="dimmed">
                {activity.activity_date}
              </Text>
            </Group>
            {details && (
              <Text size="sm" c="dimmed" mt={6}>
                {details}
              </Text>
            )}
          </div>
        </Group>

        <Menu shadow="md" width={160} position="bottom-end">
          <Menu.Target>
            <ActionIcon
              variant="subtle"
              color="gray"
              aria-label="Activity actions"
              style={{ color: "#cbd5e1" }}
            >
              <IconDots size={18} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              color="red"
              leftSection={<IconTrash size={14} />}
              onClick={() => onDelete(activity.id)}
            >
              Delete
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Card>
  );
}
