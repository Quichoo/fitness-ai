import { Card, Title, Group, ThemeIcon, Text, Box } from "@mantine/core";
import { IconBolt } from "@tabler/icons-react";

interface OneRepMax {
  exercise_name: string;
  estimated_1rm_kg: number;
}

interface OneRepMaxCardProps {
  oneRepMaxes: OneRepMax[];
}

export function OneRepMaxCard({ oneRepMaxes }: OneRepMaxCardProps) {
  const splitIndex = Math.ceil(oneRepMaxes.length / 2);
  const leftColumn = oneRepMaxes.slice(0, splitIndex);
  const rightColumn = oneRepMaxes.slice(splitIndex);

  return (
    <Card
      padding="xl"
      radius="lg"
      withBorder
      style={{
        background:
          "linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.82))",
        borderColor: "rgba(148, 163, 184, 0.16)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      <Group gap="sm" mb="lg">
        <ThemeIcon
          color="yellow"
          variant="filled"
          size={36}
          radius="md"
          style={{ background: "linear-gradient(135deg, #f5d76e, #d8a60a)" }}
        >
          <IconBolt size={19} />
        </ThemeIcon>

        <div>
          <Title order={3} fw={700} size={28} c="white">
            Estimated 1RM
          </Title>

          <Text size="xs" c="dimmed">
            Based on your latest sets and reps
          </Text>
        </div>
      </Group>

      {oneRepMaxes.length === 0 ? (
        <Text c="dimmed" size="sm">
          Log some workout sets to see your estimated max lifts here.
        </Text>
      ) : (
        <Box
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.26fr)",
            gap: 28,
            alignItems: "center",
          }}
        >
          <div
            style={{
              minHeight: 180,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <svg
              viewBox="0 0 460 160"
              width="100%"
              height="100%"
              preserveAspectRatio="none"
              style={{ opacity: 0.9 }}
            >
              <defs>
                <linearGradient id="orm-fill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="rgba(250,204,21,0.42)" />
                  <stop offset="100%" stopColor="rgba(250,204,21,0)" />
                </linearGradient>
              </defs>

              <path
                d="M0 112 C 60 118, 80 72, 120 82 C 150 90, 170 118, 220 102 C 255 92, 280 62, 330 72 C 375 80, 390 90, 460 72 L460 160 L0 160 Z"
                fill="url(#orm-fill)"
              />
              <path
                d="M0 112 C 60 118, 80 72, 120 82 C 150 90, 170 118, 220 102 C 255 92, 280 62, 330 72 C 375 80, 390 90, 460 72"
                fill="none"
                stroke="#facc15"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <Box style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[leftColumn, rightColumn].map((column, index) => (
              <Box key={index} style={{ display: "grid", gap: 10 }}>
                {column.map((lift) => (
                  <Group
                    key={lift.exercise_name}
                    justify="space-between"
                    wrap="nowrap"
                    gap="md"
                    style={{ borderBottom: "1px solid rgba(148, 163, 184, 0.08)" }}
                  >
                    <Text size="sm" c="gray.2" style={{ whiteSpace: "nowrap" }}>
                      {lift.exercise_name}
                    </Text>

                    <Text size="sm" fw={700} c="yellow.4" style={{ whiteSpace: "nowrap" }}>
                      {Number(lift.estimated_1rm_kg).toFixed(2)} kg
                    </Text>
                  </Group>
                ))}
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Card>
  );
}
