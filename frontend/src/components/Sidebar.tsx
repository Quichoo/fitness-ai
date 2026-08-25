import { NavLink, Text, Avatar, Stack, Box, Divider } from "@mantine/core";
import { NavLink as RouterLink, useLocation } from "react-router-dom";
import {
  IconHome,
  IconTarget,
  IconBarbell,
  IconClipboardList,
  IconUser,
  IconLogout,
  IconMessageCircle,
  IconRun,
  IconChartLine,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { apiGet } from "../lib/api";
import { useAuth } from "../lib/AuthContext";

const navItems = [
  { to: "/", label: "Dashboard", icon: IconHome },
  { to: "/coach", label: "AI Coach", icon: IconMessageCircle },
  { to: "/goals", label: "Goals", icon: IconTarget },
  { to: "/exercises", label: "Exercises", icon: IconBarbell },
  { to: "/workouts", label: "Workouts", icon: IconClipboardList },
  { to: "/activities", label: "Activities", icon: IconRun },
  { to: "/profile", label: "Profile", icon: IconUser },
  { to: "/progress", label: "Progress", icon: IconChartLine },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const { session } = useAuth();
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    apiGet("/api/v1/profile")
      .then((p) => setDisplayName(p.display_name))
      .catch(() => {});
  }, []);

  return (
    <Box
      p="md"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "linear-gradient(180deg, rgba(7,11,20,0.98), rgba(11,17,29,0.96))",
        borderRight: "1px solid rgba(148, 163, 184, 0.12)",
      }}
    >
      <Stack align="center" gap={6} mb="lg" mt="xs">
        <Avatar
          radius="xl"
          size={42}
          style={{
            background: "linear-gradient(135deg, #7c3aed, #a855f7)",
            color: "white",
            boxShadow: "0 0 0 3px rgba(124,58,237,0.18)",
          }}
        >
          {(displayName || session?.user.email || "?").charAt(0).toUpperCase()}
        </Avatar>
        <Text fw={600} size="sm" c="white">
          {displayName || "Set your name"}
        </Text>
        <Text size="xs" c="dimmed">
          {session?.user.email}
        </Text>
      </Stack>

      <Divider mb="md" opacity={0.1} />

      <nav aria-label="Main navigation" style={{ flex: 1 }}>
        <Stack gap={6}>
          {navItems.map((item) => {
            const active = location.pathname === item.to;

            return (
              <NavLink
                key={item.to}
                component={RouterLink}
                to={item.to}
                label={item.label}
                leftSection={<item.icon size={18} />}
                active={active}
                variant="subtle"
                onClick={onNavigate}
                style={{
                  borderRadius: 10,
                  background: active ? "rgba(124, 58, 237, 0.38)" : "transparent",
                  color: active ? "#fff" : "#dfe7ff",
                  border: active ? "1px solid rgba(168, 85, 247, 0.52)" : "1px solid transparent",
                  padding: "8px 10px",
                }}
              />
            );
          })}
        </Stack>
      </nav>

      <NavLink
        label="Log out"
        leftSection={<IconLogout size={18} />}
        onClick={() => supabase.auth.signOut()}
        c="red"
        style={{
          borderRadius: 10,
          padding: "8px 10px",
        }}
      />
    </Box>
  );
}
