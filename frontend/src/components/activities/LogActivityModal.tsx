import { useState } from "react";
import {
  Stack,
  Select,
  TextInput,
  Group,
  Textarea,
  Button,
  Text,
} from "@mantine/core";
import { IconRun } from "@tabler/icons-react";
import { apiPost } from "../../lib/api";
import { ActionModal } from "../shared/ActionModal";

function emptyFormState() {
  return {
    activityType: "running" as string | null,
    activityDate: "",
    distanceKm: "",
    durationMinutes: "",
    pace: "",
    speed: "",
    elevation: "",
    heartRate: "",
    notes: "",
  };
}

interface LogActivityModalProps {
  opened: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function LogActivityModal({
  opened,
  onClose,
  onCreated,
}: LogActivityModalProps) {
  // One state object for all nine related fields, instead of nine
  // separate useState calls - they're always read and reset together.
  const [form, setForm] = useState(emptyFormState());
  const [error, setError] = useState<string | null>(null);

  const update =
    (field: keyof ReturnType<typeof emptyFormState>) =>
    (value: string | null) =>
      setForm((prev) => ({ ...prev, [field]: value ?? "" }));

  const handleClose = () => {
    setForm(emptyFormState());
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiPost("/api/v1/activities", {
        activity_type: form.activityType,
        activity_date: form.activityDate,
        distance_km: form.distanceKm ? Number(form.distanceKm) : null,
        duration_minutes: form.durationMinutes
          ? Number(form.durationMinutes)
          : null,
        avg_pace_min_per_km: form.pace ? Number(form.pace) : null,
        avg_speed_kmh: form.speed ? Number(form.speed) : null,
        elevation_gain_m: form.elevation ? Number(form.elevation) : null,
        avg_heart_rate: form.heartRate ? Number(form.heartRate) : null,
        notes: form.notes || null,
      });
      setForm(emptyFormState());
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <ActionModal
      opened={opened}
      onClose={handleClose}
      title="Log an activity"
      icon={<IconRun size={14} />}
      iconColor="lime"
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
          <Select
            label="Activity type"
            data={[
              { value: "running", label: "Running" },
              { value: "cycling", label: "Cycling" },
              { value: "walking", label: "Walking" },
            ]}
            value={form.activityType}
            onChange={update("activityType")}
            allowDeselect={false}
          />
          <TextInput
            label="Date"
            type="date"
            value={form.activityDate}
            onChange={(e) => update("activityDate")(e.currentTarget.value)}
            required
          />
          <Group grow>
            <TextInput
              label="Distance (km)"
              value={form.distanceKm}
              onChange={(e) => update("distanceKm")(e.currentTarget.value)}
            />
            <TextInput
              label="Duration (min)"
              value={form.durationMinutes}
              onChange={(e) => update("durationMinutes")(e.currentTarget.value)}
            />
          </Group>

          {(form.activityType === "running" ||
            form.activityType === "walking") && (
            <TextInput
              label="Avg pace (min/km)"
              value={form.pace}
              onChange={(e) => update("pace")(e.currentTarget.value)}
            />
          )}

          {form.activityType === "cycling" && (
            <Group grow>
              <TextInput
                label="Avg speed (km/h)"
                value={form.speed}
                onChange={(e) => update("speed")(e.currentTarget.value)}
              />
              <TextInput
                label="Elevation gain (m)"
                value={form.elevation}
                onChange={(e) => update("elevation")(e.currentTarget.value)}
              />
            </Group>
          )}

          <TextInput
            label="Avg heart rate (optional)"
            value={form.heartRate}
            onChange={(e) => update("heartRate")(e.currentTarget.value)}
          />
          <Textarea
            label="Notes (optional)"
            value={form.notes}
            onChange={(e) => update("notes")(e.currentTarget.value)}
            autosize
            minRows={2}
          />

          {error && (
            <Text c="red" size="sm">
              {error}
            </Text>
          )}
          <Button type="submit" fullWidth mt="sm">
            Save activity
          </Button>
        </Stack>
      </form>
    </ActionModal>
  );
}
