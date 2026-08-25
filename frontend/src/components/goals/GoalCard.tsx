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
  IconTrendingDown,
  IconBolt,
  IconRun,
  IconBike,
  IconDots,
  IconTrash,
  IconCheck,
} from "@tabler/icons-react";
import { OBJECTIVES_BY_CATEGORY } from "../../constants/goalOptions";

interface Goal {
  id: string;
  category: string;
  objective: string;
  metrics: Record<string, any>;
  training_preferences: Record<string, any>;
  deadline: string | null;
  status: string;
}

const CATEGORY_ICON: Record<
  string,
  { icon: typeof IconBarbell; color: string }
> = {
  general_fitness: { icon: IconBarbell, color: "orange" },
  weight_loss: { icon: IconTrendingDown, color: "teal" },
  muscle_gain: { icon: IconBarbell, color: "grape" },
  strength: { icon: IconBolt, color: "yellow" },
  running: { icon: IconRun, color: "lime" },
  cycling: { icon: IconBike, color: "cyan" },
};

const formatMetricLabel = (key: string) => key.replace(/_/g, " ");

interface GoalCardProps {
  goal: Goal;
  onToggleStatus: (goal: Goal) => void;
  onDelete: (id: string) => void;
}

export function GoalCard({ goal, onToggleStatus, onDelete }: GoalCardProps) {
  const meta = CATEGORY_ICON[goal.category] ?? CATEGORY_ICON.general_fitness;
  const GoalIcon = meta.icon;
  const objectiveLabel =
    OBJECTIVES_BY_CATEGORY[goal.category]?.find(
      (o) => o.value === goal.objective,
    )?.label ?? goal.objective.replace(/_/g, " ");
  const metricEntries = Object.entries(goal.metrics ?? {}).filter(
    ([, v]) => v !== null && v !== "",
  );

  return (
    <Card withBorder padding="md" radius="md">
      <Group justify="space-between" wrap="nowrap" align="flex-start">
        <Group wrap="nowrap" align="flex-start">
          <ThemeIcon color={meta.color} variant="filled" size="lg" radius="md">
            <GoalIcon size={18} />
          </ThemeIcon>
          <div>
            <Text fw={600} tt="capitalize">
              {goal.category.replace("_", " ")}
            </Text>
            <Text size="sm" c="dimmed" mb={4}>
              {objectiveLabel}
            </Text>
            {metricEntries.length > 0 && (
              <Text size="xs" c="dimmed">
                {metricEntries
                  .map(([k, v]) => `${formatMetricLabel(k)}: ${v}`)
                  .join(" · ")}
              </Text>
            )}
            {goal.deadline && (
              <Text size="xs" c="dimmed">
                Deadline: {goal.deadline}
              </Text>
            )}
          </div>
        </Group>
        <Group gap="xs">
          <Badge
            variant={goal.status === "active" ? "filled" : "light"}
            color={goal.status === "active" ? "teal" : "gray"}
          >
            {goal.status}
          </Badge>
          <Menu shadow="md" width={180} position="bottom-end">
            <Menu.Target>
              <ActionIcon
                variant="subtle"
                color="gray"
                aria-label="Goal actions"
              >
                <IconDots size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconCheck size={14} />}
                onClick={() => onToggleStatus(goal)}
              >
                Mark as {goal.status === "active" ? "completed" : "active"}
              </Menu.Item>
              <Menu.Item
                color="red"
                leftSection={<IconTrash size={14} />}
                onClick={() => onDelete(goal.id)}
              >
                Delete
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>
    </Card>
  );
}
