import {
  Card,
  Title,
  Group,
  ThemeIcon,
  Stack,
  Select,
  TextInput,
  NumberInput,
  Button,
  Divider,
  Text,
} from "@mantine/core";
import { IconTarget } from "@tabler/icons-react";
import { apiPost } from "../../lib/api";
import { useGoalForm } from "../../hooks/useGoalForm";
import { CATEGORIES } from "../../constants/goalOptions";
import { useState } from "react";
import type { FieldDef } from "../../constants/goalOptions";

interface GoalFormCardProps {
  onCreated: () => void;
}

export function GoalFormCard({ onCreated }: GoalFormCardProps) {
  const goalForm = useGoalForm();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!goalForm.form.objective) {
      setError("Please select what you're training for.");
      return;
    }

    try {
      await apiPost("/api/v1/goals", goalForm.buildPayload());
      goalForm.reset();
      onCreated();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const renderField = (field: FieldDef) => {
    const value = goalForm.form.fieldValues[field.key] ?? "";
    if (field.type === "select") {
      return (
        <Select
          key={field.key}
          label={field.label}
          data={field.options ?? []}
          value={value || null}
          onChange={(v) => goalForm.updateField(field.key, v ?? "")}
        />
      );
    }
    if (field.type === "number") {
      return (
        <NumberInput
          key={field.key}
          label={field.label}
          value={value}
          onChange={(v) => goalForm.updateField(field.key, String(v))}
        />
      );
    }
    return (
      <TextInput
        key={field.key}
        label={field.label}
        value={value}
        onChange={(e) => goalForm.updateField(field.key, e.currentTarget.value)}
      />
    );
  };

  return (
    <Card withBorder padding="md" radius="md">
      <Group gap="xs" mb="md">
        <ThemeIcon color="indigo" variant="filled" size="md" radius="md">
          <IconTarget size={16} />
        </ThemeIcon>
        <Title order={5}>Add a new goal</Title>
      </Group>
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
          <Select
            label="Category"
            data={CATEGORIES}
            value={goalForm.form.category}
            onChange={(v) => v && goalForm.setCategory(v)}
            allowDeselect={false}
          />

          {goalForm.objectiveOptions.length > 1 && (
            <Select
              label="What are you training for?"
              data={goalForm.objectiveOptions.map((o) => ({
                value: o.value,
                label: o.label,
              }))}
              value={goalForm.form.objective}
              onChange={goalForm.setObjective}
              allowDeselect={false}
            />
          )}

          {goalForm.currentObjective?.fields.map(renderField)}

          <TextInput
            label="Deadline (optional)"
            type="date"
            value={goalForm.form.deadline}
            onChange={(e) => goalForm.setDeadline(e.currentTarget.value)}
          />

          <Divider
            label="Training availability (optional)"
            labelPosition="left"
            mt="xs"
          />
          <Group grow>
            <TextInput
              label="Days/week"
              value={goalForm.form.daysPerWeek}
              onChange={(e) => goalForm.setDaysPerWeek(e.currentTarget.value)}
            />
            <TextInput
              label="Session (min)"
              value={goalForm.form.sessionDuration}
              onChange={(e) =>
                goalForm.setSessionDuration(e.currentTarget.value)
              }
            />
          </Group>

          {error && (
            <Text c="red" size="sm">
              {error}
            </Text>
          )}
          <Button type="submit" fullWidth mt="sm">
            Add goal
          </Button>
        </Stack>
      </form>
    </Card>
  );
}
