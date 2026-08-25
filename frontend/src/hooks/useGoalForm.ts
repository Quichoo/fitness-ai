import { useState } from "react";
import { OBJECTIVES_BY_CATEGORY } from "../constants/goalOptions";

function emptyFormState() {
  return {
    category: "general_fitness",
    objective: "general" as string | null,
    fieldValues: {} as Record<string, string>,
    deadline: "",
    daysPerWeek: "",
    sessionDuration: "",
  };
}

/**
 * Single source of truth for the goal creation form's state. Consolidates
 * what would otherwise be 6+ separate useState calls, since category,
 * objective, and fieldValues are never meaningfully independent - changing
 * category always resets objective and fields together.
 */
export function useGoalForm() {
  const [form, setForm] = useState(emptyFormState());

  const objectiveOptions = OBJECTIVES_BY_CATEGORY[form.category] ?? [];
  const currentObjective = objectiveOptions.find(
    (o) => o.value === form.objective,
  );

  const setCategory = (category: string) => {
    const firstObjective = OBJECTIVES_BY_CATEGORY[category]?.[0]?.value ?? null;
    setForm((prev) => ({
      ...prev,
      category,
      objective: firstObjective,
      fieldValues: {},
    }));
  };

  const setObjective = (objective: string | null) => {
    setForm((prev) => ({ ...prev, objective, fieldValues: {} }));
  };

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      fieldValues: { ...prev.fieldValues, [key]: value },
    }));
  };

  const setDeadline = (deadline: string) =>
    setForm((prev) => ({ ...prev, deadline }));
  const setDaysPerWeek = (daysPerWeek: string) =>
    setForm((prev) => ({ ...prev, daysPerWeek }));
  const setSessionDuration = (sessionDuration: string) =>
    setForm((prev) => ({ ...prev, sessionDuration }));

  const reset = () => setForm(emptyFormState());

  /** Builds the exact payload shape the backend expects, from the current form state. */
  const buildPayload = () => {
    const metrics: Record<string, unknown> = {};
    for (const field of currentObjective?.fields ?? []) {
      const raw = form.fieldValues[field.key];
      if (!raw) continue;
      metrics[field.key] = field.type === "number" ? Number(raw) : raw;
    }

    const training_preferences: Record<string, unknown> = {};
    if (form.daysPerWeek)
      training_preferences.days_per_week = Number(form.daysPerWeek);
    if (form.sessionDuration)
      training_preferences.session_duration_minutes = Number(
        form.sessionDuration,
      );

    return {
      category: form.category,
      objective: form.objective,
      metrics,
      training_preferences,
      deadline: form.deadline || null,
    };
  };

  return {
    form,
    objectiveOptions,
    currentObjective,
    setCategory,
    setObjective,
    updateField,
    setDeadline,
    setDaysPerWeek,
    setSessionDuration,
    reset,
    buildPayload,
  };
}
