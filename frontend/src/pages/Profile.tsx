import { useEffect, useState } from "react";
import {
  Title,
  Text,
  TextInput,
  Select,
  Button,
  Stack,
  Card,
  Grid,
  Avatar,
  Badge,
  Group,
  Divider,
  Box,
} from "@mantine/core";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { apiGet, apiPatch } from "../lib/api";
import { useAuth } from "../lib/AuthContext";

interface ProfileData {
  display_name: string | null;
  fitness_level: string | null;
  height_cm: number | null;
  weight_kg: number | null;
}

export function Profile() {
  const { session } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [fitnessLevel, setFitnessLevel] = useState<string | null>("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProfile = () => {
    apiGet("/api/v1/profile")
      .then((data: ProfileData) => {
        setDisplayName(data.display_name || "");
        setFitnessLevel(data.fitness_level || "");
        setHeightCm(data.height_cm?.toString() || "");
        setWeightKg(data.weight_kg?.toString() || "");
        setLoading(false);
      })
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    try {
      await apiPatch("/api/v1/profile", {
        display_name: displayName || null,
        fitness_level: fitnessLevel || null,
        height_cm: heightCm ? Number(heightCm) : null,
        weight_kg: weightKg ? Number(weightKg) : null,
      });
      setSaved(true);
      loadProfile();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <Text>Loading...</Text>;

  return (
    <Box style={{ maxWidth: 1200, margin: "0 auto", padding: "8px 0 40px" }}>
      <Title order={1} fw={700} size={46} c="white">
        Profile
      </Title>
      <Text c="dimmed" size="sm" mb="lg">
        Manage your personal and fitness details.
      </Text>

      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card
            withBorder
            padding="xl"
            radius="lg"
            style={{
              background:
                "linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.8))",
              borderColor: "rgba(148, 163, 184, 0.15)",
            }}
          >
            <Stack align="center" gap="xs">
              <Avatar
                size={90}
                radius={100}
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                  boxShadow: "0 0 0 4px rgba(124,58,237,0.18)",
                }}
              >
                {(displayName || session?.user.email || "?")
                  .charAt(0)
                  .toUpperCase()}
              </Avatar>
              <Text fw={700} size="lg" mt="sm" c="white">
                {displayName || "Set your name"}
              </Text>
              <Text size="sm" c="dimmed">
                {session?.user.email}
              </Text>
              {fitnessLevel && (
                <Badge variant="filled" color="indigo" tt="capitalize" mt="xs">
                  {fitnessLevel}
                </Badge>
              )}
            </Stack>

            <Divider my="lg" opacity={0.15} />

            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">
                Height
              </Text>
              <Text fw={600} c="white">{heightCm ? `${heightCm} cm` : "—"}</Text>
            </Group>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Weight
              </Text>
              <Text fw={600} c="white">{weightKg ? `${weightKg} kg` : "—"}</Text>
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card
            withBorder
            padding="xl"
            radius="lg"
            style={{
              background:
                "linear-gradient(180deg, rgba(15, 23, 42, 0.94), rgba(30, 41, 59, 0.82))",
              borderColor: "rgba(148, 163, 184, 0.15)",
            }}
          >
            <Title order={3} fw={700} c="white" mb="lg">
              Edit details
            </Title>
            <form onSubmit={handleSave}>
              <Stack gap="lg">
                <TextInput
                  label="Display name"
                  size="md"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.currentTarget.value)}
                  styles={{
                    input: {
                      background: "rgba(15, 23, 42, 0.5)",
                      borderColor: "rgba(148, 163, 184, 0.18)",
                      color: "white",
                    },
                  }}
                />
                <Select
                  label="Fitness level"
                  size="md"
                  placeholder="Not set"
                  data={["beginner", "intermediate", "advanced"]}
                  value={fitnessLevel}
                  onChange={setFitnessLevel}
                  clearable
                  styles={{
                    input: {
                      background: "rgba(15, 23, 42, 0.5)",
                      borderColor: "rgba(148, 163, 184, 0.18)",
                      color: "white",
                    },
                  }}
                />
                <Group grow>
                  <TextInput
                    label="Height (cm)"
                    size="md"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.currentTarget.value)}
                    styles={{
                      input: {
                        background: "rgba(15, 23, 42, 0.5)",
                        borderColor: "rgba(148, 163, 184, 0.18)",
                        color: "white",
                      },
                    }}
                  />
                  <TextInput
                    label="Weight (kg)"
                    size="md"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.currentTarget.value)}
                    styles={{
                      input: {
                        background: "rgba(15, 23, 42, 0.5)",
                        borderColor: "rgba(148, 163, 184, 0.18)",
                        color: "white",
                      },
                    }}
                  />
                </Group>

                <Group justify="space-between" mt="md">
                  <Button
                    type="submit"
                    size="md"
                    leftSection={<IconDeviceFloppy size={18} />}
                    style={{
                      background: "linear-gradient(135deg, #3b82f6, #4f46e5)",
                      border: "none",
                    }}
                  >
                    Save profile
                  </Button>
                  {error && (
                    <Text c="red" size="sm">
                      {error}
                    </Text>
                  )}
                  {saved && (
                    <Text c="teal" size="sm">
                      Saved.
                    </Text>
                  )}
                </Group>
              </Stack>
            </form>
          </Card>
        </Grid.Col>
      </Grid>
    </Box>
  );
}
