import { useEffect, useState } from "react";
import {
  Title,
  Text,
  Card,
  Badge,
  Group,
  TextInput,
  Select,
  SimpleGrid,
  ThemeIcon,
  Stack,
  Box,
} from "@mantine/core";
import {
  IconSearch,
  IconBarbell,
  IconYoga,
  IconHeartbeat,
  IconFlame,
  IconRun,
  IconBolt,
  IconBike,
} from "@tabler/icons-react";
import { apiGet } from "../lib/api";

interface Exercise {
  id: string;
  name: string;
  muscle_group: string | null;
  equipment: string | null;
  difficulty: string | null;
}

const GROUP_META: Record<string, { icon: typeof IconBarbell; color: string }> =
  {
    arms: { icon: IconBarbell, color: "blue" },
    back: { icon: IconYoga, color: "violet" },
    chest: { icon: IconHeartbeat, color: "pink" },
    core: { icon: IconFlame, color: "teal" },
    legs: { icon: IconRun, color: "orange" },
    shoulders: { icon: IconBolt, color: "yellow" },
    full_body: { icon: IconBike, color: "grape" },
  };

const DIFFICULTY_COLOR: Record<string, string> = {
  beginner: "green",
  intermediate: "blue",
  advanced: "violet",
};

export function Exercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState("");
  const [equipmentFilter, setEquipmentFilter] = useState<string | null>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet("/api/v1/exercises")
      .then(setExercises)
      .catch((err) => setError(err.message));
  }, []);

  const equipmentOptions = Array.from(
    new Set(
      exercises.map((ex) => ex.equipment).filter((e): e is string => !!e),
    ),
  ).sort();

  const filtered = exercises.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    const matchesEquipment =
      !equipmentFilter || ex.equipment === equipmentFilter;
    return matchesSearch && matchesEquipment;
  });

  const grouped = filtered.reduce<Record<string, Exercise[]>>((acc, ex) => {
    const group = ex.muscle_group || "other";
    if (!acc[group]) acc[group] = [];
    acc[group].push(ex);
    return acc;
  }, {});

  const groupOrder = Object.keys(grouped).sort();

  return (
    <Box style={{ maxWidth: 1280, margin: "0 auto", padding: "8px 0 40px" }}>
      <Title order={1} fw={700} size={46} c="white">
        Exercises
      </Title>
      <Text c="dimmed" size="sm" mb="lg">
        Browse and discover exercises for every muscle group.
      </Text>

      <Group mb="xl" grow>
        <TextInput
          placeholder="Search exercises..."
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
          placeholder="All equipment"
          data={equipmentOptions}
          value={equipmentFilter}
          onChange={setEquipmentFilter}
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

      {error && <Text c="red">{error}</Text>}
      {filtered.length === 0 && (
        <Text c="dimmed" size="sm">
          No exercises found.
        </Text>
      )}

      <Stack gap="xl">
        {groupOrder.map((group) => {
          const meta = GROUP_META[group] ?? {
            icon: IconBarbell,
            color: "gray",
          };
          const GroupIcon = meta.icon;
          return (
            <div key={group}>
              <Group gap="xs" mb="sm">
                <ThemeIcon
                  color={meta.color}
                  variant="filled"
                  size={28}
                  radius="md"
                  style={{
                    background:
                      meta.color === "blue"
                        ? "linear-gradient(135deg, #60a5fa, #3b82f6)"
                        : meta.color === "violet"
                          ? "linear-gradient(135deg, #a78bfa, #8b5cf6)"
                          : meta.color === "pink"
                            ? "linear-gradient(135deg, #f472b6, #ec4899)"
                            : meta.color === "teal"
                              ? "linear-gradient(135deg, #2dd4bf, #14b8a6)"
                              : meta.color === "orange"
                                ? "linear-gradient(135deg, #fbbf24, #f59e0b)"
                                : meta.color === "yellow"
                                  ? "linear-gradient(135deg, #fcd34d, #fbbf24)"
                                  : "linear-gradient(135deg, #c084fc, #8b5cf6)",
                  }}
                >
                  <GroupIcon size={16} />
                </ThemeIcon>
                <Title order={3} fw={700} tt="capitalize" c="white">
                  {group.replace("_", " ")}
                </Title>
              </Group>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                {grouped[group].map((ex) => (
                  <Card
                    key={ex.id}
                    withBorder
                    padding="md"
                    radius="lg"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(30, 41, 59, 0.82))",
                      borderColor: "rgba(148, 163, 184, 0.15)",
                    }}
                  >
                    <Group justify="space-between" wrap="nowrap" align="center">
                      <Group wrap="nowrap" gap="sm">
                        <ThemeIcon
                          color={meta.color}
                          variant="filled"
                          size="lg"
                          radius="md"
                          style={{
                            background:
                              meta.color === "blue"
                                ? "linear-gradient(135deg, #60a5fa, #3b82f6)"
                                : meta.color === "violet"
                                  ? "linear-gradient(135deg, #a78bfa, #8b5cf6)"
                                  : meta.color === "pink"
                                    ? "linear-gradient(135deg, #f472b6, #ec4899)"
                                    : meta.color === "teal"
                                      ? "linear-gradient(135deg, #2dd4bf, #14b8a6)"
                                      : meta.color === "orange"
                                        ? "linear-gradient(135deg, #fbbf24, #f59e0b)"
                                        : meta.color === "yellow"
                                          ? "linear-gradient(135deg, #fcd34d, #fbbf24)"
                                          : "linear-gradient(135deg, #c084fc, #8b5cf6)",
                          }}
                        >
                          <GroupIcon size={18} />
                        </ThemeIcon>
                        <div>
                          <Text fw={600} size="sm" c="white">
                            {ex.name}
                          </Text>
                          <Text size="xs" c="dimmed" mt={4}>
                            {ex.equipment}
                          </Text>
                        </div>
                      </Group>
                      <Badge
                        variant="filled"
                        color={DIFFICULTY_COLOR[ex.difficulty ?? ""] ?? "gray"}
                        tt="capitalize"
                        size="sm"
                      >
                        {ex.difficulty}
                      </Badge>
                    </Group>
                  </Card>
                ))}
              </SimpleGrid>
            </div>
          );
        })}
      </Stack>
    </Box>
  );
}
