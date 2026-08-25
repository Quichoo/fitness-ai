import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Title,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Text,
  Paper,
  Anchor,
} from "@mantine/core";
import { supabase } from "../lib/supabase";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) setError(error.message);
  };

  return (
    <div
      style={{
        maxWidth: 420,
        margin: "100px auto",
        padding: "0 16px",
      }}
    >
      <Title order={1} c="white" mb="lg" ta="center" fw={700} size={42}>
        Log in
      </Title>
      <Paper
        withBorder
        p="lg"
        radius="lg"
        style={{
          background:
            "linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.8))",
          borderColor: "rgba(148, 163, 184, 0.18)",
          boxShadow: "0 25px 60px rgba(15, 23, 42, 0.6)",
        }}
      >
        <form onSubmit={handleLogin}>
          <Stack gap="sm">
            <TextInput
              label="Email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              styles={{
                input: {
                  background: "rgba(15, 23, 42, 0.5)",
                  borderColor: "rgba(148, 163, 184, 0.18)",
                  color: "white",
                },
              }}
            />
            <PasswordInput
              label="Password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              styles={{
                input: {
                  background: "rgba(15, 23, 42, 0.5)",
                  borderColor: "rgba(148, 163, 184, 0.18)",
                  color: "white",
                },
              }}
            />
            {error && (
              <Text c="red" size="sm">
                {error}
              </Text>
            )}
            <Button
              type="submit"
              loading={loading}
              fullWidth
              mt="sm"
              style={{
                background: "linear-gradient(135deg, #3b82f6, #4f46e5)",
                border: "none",
              }}
            >
              Log in
            </Button>
          </Stack>
        </form>
      </Paper>
      <Text ta="center" size="sm" c="dimmed" mt="md">
        No account? {" "}
        <Anchor component={Link} to="/signup" c="violet.3">
          Sign up
        </Anchor>
      </Text>
    </div>
  );
}
