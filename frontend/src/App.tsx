import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppShell, Burger, Group, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import { Sidebar } from "./components/Sidebar";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Goals } from "./pages/Goals";
import { Exercises } from "./pages/Exercises";
import { Workouts } from "./pages/Workouts";
import { WorkoutDetail } from "./pages/WorkoutDetail";
import { Profile } from "./pages/Profile";
import { Signup } from "./pages/Signup";
import { Coach } from "./pages/Coach";
import { Activities } from "./pages/Activities";
import { Progress } from "./pages/Progress";

function AppRoutes() {
  const { session, loading } = useAuth();
  const [opened, { toggle }] = useDisclosure();

  if (loading) return <p style={{ padding: 20 }}>Loading...</p>;

  if (!session) {
    return (
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <AppShell
      navbar={{ width: 240, breakpoint: "sm", collapsed: { mobile: !opened } }}
      header={{ height: 56, offset: false }}
      padding="md"
      styles={{
        main: {
          background:
            "radial-gradient(circle at top, rgba(56, 189, 248, 0.08), transparent 30%), #0b1120",
        },
        navbar: {
          background: "rgba(9, 14, 24, 0.96)",
        },
      }}
    >
      <AppShell.Header hiddenFrom="sm">
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} size="sm" />
          <Text fw={600}>Fitness Companion</Text>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar>
        <Sidebar onNavigate={() => opened && toggle()} />
      </AppShell.Navbar>

      <AppShell.Main pt={{ base: 70, sm: "md" }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/exercises" element={<Exercises />} />
          <Route path="/workouts" element={<Workouts />} />
          <Route path="/workouts/:id" element={<WorkoutDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/coach" element={<Coach />} />
          <Route path="*" element={<Navigate to="/" />} />
          <Route path="/activities" element={<Activities />} />
          <Route path="/progress" element={<Progress />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
