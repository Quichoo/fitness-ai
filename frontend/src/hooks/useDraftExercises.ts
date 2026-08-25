import { useState } from "react";

export interface DraftSet {
  reps: string;
  weight_kg: string;
}

export interface DraftExercise {
  exercise_id: string | null;
  sets: DraftSet[];
}

function emptySet(): DraftSet {
  return { reps: "", weight_kg: "" };
}

function emptyExercise(): DraftExercise {
  return { exercise_id: null, sets: [emptySet()] };
}

/**
 * Single source of truth for building a list of exercises, each with its
 * own list of sets. Used by the manual workout form; reusable later for
 * an "edit workout" feature without re-deriving this logic again.
 */
export function useDraftExercises() {
  const [exercises, setExercises] = useState<DraftExercise[]>([
    emptyExercise(),
  ]);

  const updateExercise = (index: number, exercise_id: string | null) =>
    setExercises((prev) =>
      prev.map((ex, i) => (i === index ? { ...ex, exercise_id } : ex)),
    );

  const updateSet = (
    exIndex: number,
    setIndex: number,
    field: keyof DraftSet,
    value: string,
  ) =>
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIndex
          ? {
              ...ex,
              sets: ex.sets.map((s, j) =>
                j === setIndex ? { ...s, [field]: value } : s,
              ),
            }
          : ex,
      ),
    );

  const addExercise = () => setExercises((prev) => [...prev, emptyExercise()]);
  const removeExercise = (index: number) =>
    setExercises((prev) => prev.filter((_, i) => i !== index));
  const loadFrom = (exercises: DraftExercise[]) => setExercises(exercises);

  const addSet = (exIndex: number) =>
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIndex ? { ...ex, sets: [...ex.sets, emptySet()] } : ex,
      ),
    );

  const removeSet = (exIndex: number, setIndex: number) =>
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIndex
          ? { ...ex, sets: ex.sets.filter((_, j) => j !== setIndex) }
          : ex,
      ),
    );

  const reset = () => setExercises([emptyExercise()]);

  return {
    exercises,
    updateExercise,
    updateSet,
    addExercise,
    removeExercise,
    addSet,
    removeSet,
    reset,
    loadFrom,
  };
}
