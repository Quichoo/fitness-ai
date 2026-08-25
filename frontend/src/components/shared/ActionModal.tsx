import type { ReactNode } from "react";
import { Modal, Group, ThemeIcon, Text } from "@mantine/core";

interface ActionModalProps {
  opened: boolean;
  onClose: () => void;
  title: string;
  icon: ReactNode;
  iconColor: string;
  size?: string;
  children: ReactNode;
}

/**
 * Shared chrome for any "form inside a modal" flow - the title bar with
 * a colored icon badge is identical across every such modal in the app
 * (log workout, generate workout, and future ones like log activity).
 * Only the body content differs, passed in as children.
 */
export function ActionModal({
  opened,
  onClose,
  title,
  icon,
  iconColor,
  size = "md",
  children,
}: ActionModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size={size}
      centered
      radius="lg"
      padding="xl"
      styles={{
        content: {
          background:
            "linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(17, 24, 39, 0.94))",
          border: "1px solid rgba(148, 163, 184, 0.14)",
          boxShadow: "0 24px 80px rgba(15, 23, 42, 0.75)",
        },
        header: {
          borderBottom: "1px solid rgba(148, 163, 184, 0.12)",
          padding: "18px 20px 16px",
          marginBottom: 0,
        },
        body: {
          padding: "18px 20px 20px",
        },
        title: {
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: "#f8fafc",
        },
      }}
      title={
        <Group gap="xs">
          <ThemeIcon
            color={iconColor}
            variant="filled"
            size={28}
            radius="md"
            style={{
              background:
                iconColor === "grape"
                  ? "linear-gradient(135deg, #a855f7, #7c3aed)"
                  : iconColor === "orange"
                    ? "linear-gradient(135deg, #f59e0b, #f97316)"
                    : "linear-gradient(135deg, #60a5fa, #3b82f6)",
            }}
          >
            {icon}
          </ThemeIcon>
          <Text fw={700} c="white" size="lg">
            {title}
          </Text>
        </Group>
      }
    >
      {children}
    </Modal>
  );
}
