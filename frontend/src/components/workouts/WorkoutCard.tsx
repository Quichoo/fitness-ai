import { Link } from "react-router-dom";
import {
  Card,
  Text,
  Group,
  Badge,
  ThemeIcon,
  ActionIcon,
  Menu,
} from "@mantine/core";
import {
  IconBarbell,
  IconSparkles,
  IconTemplate,
  IconCalendar,
  IconDots,
  IconTrash,
  IconEye,
  IconRepeat,
} from "@tabler/icons-react";

interface WorkoutListItem {
  id: string;
  name: string;
  workout_date: string;
  duration_minutes: number | null;
  source: string;
  is_template: boolean;
}

const SOURCE_META: Record<string, { icon: typeof IconBarbell; color: string }> =
  {
    manual: { icon: IconBarbell, color: "orange" },
    ai_generated: { icon: IconSparkles, color: "grape" },
    template: { icon: IconTemplate, color: "blue" },
  };

interface WorkoutCardProps {
  workout: WorkoutListItem;
  onDelete: (id: string) => void;
  onLogAgain: (workout: WorkoutListItem) => void;
}

export function WorkoutCard({
  workout,
  onDelete,
  onLogAgain,
}: WorkoutCardProps) {
  const meta = SOURCE_META[workout.source] ?? SOURCE_META.manual;
  const SourceIcon = meta.icon;

  return (
    <Card
      padding="lg"
      radius="lg"
      withBorder
      style={{
        background:
          "linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(30, 41, 59, 0.82))",
        borderColor: "rgba(148, 163, 184, 0.15)",
        borderLeft: `4px solid ${
          meta.color === "orange" ? "#f97316" : "#a855f7"
        }`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Group wrap="nowrap" gap="md">
          <ThemeIcon
            color={meta.color}
            variant="filled"
            size={48}
            radius="md"
            style={{
              background:
                meta.color === "orange"
                  ? "linear-gradient(135deg, #f59e0b, #f97316)"
                  : meta.color === "grape"
                    ? "linear-gradient(135deg, #a855f7, #7c3aed)"
                    : "linear-gradient(135deg, #60a5fa, #3b82f6)",
            }}
          >
            <SourceIcon size={24} />
          </ThemeIcon>
          <div>
            <Text
              component={Link}
              to={`/workouts/${workout.id}`}
              fw={700}
              size="lg"
              c="white"
              style={{ textDecoration: "none" }}
            >
              {workout.name}
            </Text>
            <Group gap={6} mt={4}>
              <IconCalendar size={14} color="#94a3b8" />
              <Text size="sm" c="dimmed">
                {new Date(workout.workout_date).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                })}
                {workout.duration_minutes
                  ? ` · ${workout.duration_minutes} min`
                  : ""}
              </Text>
            </Group>
          </div>
        </Group>
        <Menu shadow="md" width={180} position="bottom-end">
          <Menu.Target>
            <ActionIcon
              variant="subtle"
              color="gray"
              aria-label="Workout actions"
              style={{ color: "#cbd5e1" }}
            >
              <IconDots size={18} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              component={Link}
              to={`/workouts/${workout.id}`}
              leftSection={<IconEye size={14} />}
            >
              View details
            </Menu.Item>
            <Menu.Item
              leftSection={<IconRepeat size={14} />}
              onClick={() => onLogAgain(workout)}
            >
              Log this workout
            </Menu.Item>
            <Menu.Item
              color="red"
              leftSection={<IconTrash size={14} />}
              onClick={() => onDelete(workout.id)}
            >
              Delete
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
      <Group mt="md" gap="xs">
        {workout.is_template && (
          <Badge variant="filled" color="grape" size="sm">
            Template
          </Badge>
        )}
        <Badge
          variant="filled"
          color={meta.color === "orange" ? "orange" : meta.color === "grape" ? "grape" : "indigo"}
          size="sm"
          tt="capitalize"
        >
          {workout.source.replace("_", " ")}
        </Badge>
      </Group>
    </Card>
  );
}
