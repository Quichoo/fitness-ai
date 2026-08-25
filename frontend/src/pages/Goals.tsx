import { useEffect, useState } from "react";
import { Title, Text, Stack, Grid, Box } from "@mantine/core";
import { apiGet, apiPatch, apiDelete } from "../lib/api";
import { GoalCard } from "../components/goals/GoalCard";
import { GoalFormCard } from "../components/goals/GoalFormCard";

interface Goal {
  id: string;
  category: string;
  objective: string;
  metrics: Record<string, any>;
  training_preferences: Record<string, any>;
  deadline: string | null;
  status: string;
}

export function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadGoals = () => {
    apiGet("/api/v1/goals")
      .then(setGoals)
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const handleToggleStatus = async (goal: Goal) => {
    const nextStatus = goal.status === "active" ? "completed" : "active";
    await apiPatch(`/api/v1/goals/${goal.id}`, { status: nextStatus });
    loadGoals();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this goal?")) return;
    await apiDelete(`/api/v1/goals/${id}`);
    loadGoals();
  };

  return (
    <Box style={{ maxWidth: 1200, margin: "0 auto", padding: "8px 0 40px" }}>
      <Title order={1} fw={700} size={46} c="white">
        Goals
      </Title>
      <Text c="dimmed" size="sm" mb="lg">
        Set and track your fitness goals.
      </Text>

      {error && (
        <Text c="red" mb="md">
          {error}
        </Text>
      )}

      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <GoalFormCard onCreated={loadGoals} />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack gap="md">
            {goals.length === 0 && (
              <Text c="dimmed" size="sm">
                No goals yet - add one to get started.
              </Text>
            )}
            {goals.map((g) => (
              <GoalCard
                key={g.id}
                goal={g}
                onToggleStatus={handleToggleStatus}
                onDelete={handleDelete}
              />
            ))}
          </Stack>
        </Grid.Col>
      </Grid>
    </Box>
  );
}
