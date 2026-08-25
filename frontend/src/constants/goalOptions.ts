export interface FieldDef {
  key: string;
  label: string;
  type: "number" | "text" | "select";
  options?: string[];
  optional?: boolean;
}

export interface ObjectiveDef {
  value: string;
  label: string;
  fields: FieldDef[];
}

export const CATEGORIES = [
  { value: "general_fitness", label: "General fitness" },
  { value: "weight_loss", label: "Weight loss" },
  { value: "muscle_gain", label: "Muscle gain" },
  { value: "strength", label: "Strength" },
  { value: "running", label: "Running" },
  { value: "cycling", label: "Cycling" },
];

export const OBJECTIVES_BY_CATEGORY: Record<string, ObjectiveDef[]> = {
  general_fitness: [
    { value: "general", label: "Stay active and healthy", fields: [] },
  ],
  weight_loss: [
    {
      value: "target_weight",
      label: "Reach a target weight",
      fields: [
        {
          key: "current_weight_kg",
          label: "Current weight (kg)",
          type: "number",
        },
        {
          key: "target_weight_kg",
          label: "Target weight (kg)",
          type: "number",
        },
      ],
    },
  ],
  muscle_gain: [
    {
      value: "target_weight",
      label: "Build muscle / gain weight",
      fields: [
        {
          key: "current_weight_kg",
          label: "Current weight (kg)",
          type: "number",
        },
        {
          key: "target_weight_kg",
          label: "Target weight (kg, optional)",
          type: "number",
          optional: true,
        },
        {
          key: "training_experience",
          label: "Training experience",
          type: "select",
          options: ["beginner", "intermediate", "advanced"],
        },
      ],
    },
  ],
  strength: [
    {
      value: "one_rep_max",
      label: "Increase 1RM on a lift",
      fields: [
        { key: "exercise", label: "Exercise", type: "text" },
        { key: "current_value_kg", label: "Current 1RM (kg)", type: "number" },
        { key: "target_value_kg", label: "Target 1RM (kg)", type: "number" },
      ],
    },
  ],
  running: [
    {
      value: "distance_goal",
      label: "Run a specific distance",
      fields: [
        {
          key: "target_distance_km",
          label: "Target distance (km)",
          type: "number",
        },
        {
          key: "current_distance_km",
          label: "Current longest run (km)",
          type: "number",
          optional: true,
        },
      ],
    },
    {
      value: "pace_improvement",
      label: "Improve my pace",
      fields: [
        {
          key: "distance_km",
          label: "Reference distance (km)",
          type: "number",
        },
        {
          key: "current_pace_min_per_km",
          label: "Current pace (min/km)",
          type: "number",
        },
        {
          key: "target_pace_min_per_km",
          label: "Target pace (min/km)",
          type: "number",
        },
      ],
    },
    {
      value: "race_completion",
      label: "Complete a race",
      fields: [
        { key: "distance_km", label: "Distance (km)", type: "number" },
        {
          key: "event_name",
          label: "Event name (optional)",
          type: "text",
          optional: true,
        },
      ],
    },
    {
      value: "race_time",
      label: "Improve my race time",
      fields: [
        { key: "distance_km", label: "Distance (km)", type: "number" },
        {
          key: "current_time_minutes",
          label: "Current time (min)",
          type: "number",
        },
        {
          key: "target_time_minutes",
          label: "Target time (min)",
          type: "number",
        },
        {
          key: "event_name",
          label: "Event name (optional)",
          type: "text",
          optional: true,
        },
      ],
    },
    {
      value: "endurance_base",
      label: "Build endurance (Zone 2 / easy running)",
      fields: [
        {
          key: "target_weekly_volume_km",
          label: "Target weekly volume (km)",
          type: "number",
        },
        {
          key: "target_heart_rate_zone",
          label: "Target heart rate zone (e.g. Zone 2, 60-70% max HR)",
          type: "text",
          optional: true,
        },
      ],
    },
    {
      value: "interval_training",
      label: "Build speed with interval training",
      fields: [
        {
          key: "target_sessions_per_week",
          label: "Interval sessions per week",
          type: "number",
        },
        {
          key: "session_focus",
          label: "Focus (e.g. 400m repeats, hill sprints)",
          type: "text",
          optional: true,
        },
      ],
    },
    {
      value: "tempo_training",
      label: "Improve threshold with tempo runs",
      fields: [
        {
          key: "target_sessions_per_week",
          label: "Tempo sessions per week",
          type: "number",
        },
        {
          key: "target_pace_min_per_km",
          label: "Target tempo pace (min/km)",
          type: "number",
          optional: true,
        },
      ],
    },
  ],
  cycling: [
    {
      value: "distance_goal",
      label: "Complete a specific distance",
      fields: [
        {
          key: "target_distance_km",
          label: "Target distance (km)",
          type: "number",
        },
        {
          key: "current_distance_km",
          label: "Current longest ride (km)",
          type: "number",
          optional: true,
        },
      ],
    },
    {
      value: "speed_improvement",
      label: "Improve my speed",
      fields: [
        {
          key: "current_avg_speed_kmh",
          label: "Current avg speed (km/h)",
          type: "number",
        },
        {
          key: "target_avg_speed_kmh",
          label: "Target avg speed (km/h)",
          type: "number",
        },
      ],
    },
    {
      value: "event_completion",
      label: "Complete an event",
      fields: [
        { key: "distance_km", label: "Distance (km)", type: "number" },
        {
          key: "event_name",
          label: "Event name (optional)",
          type: "text",
          optional: true,
        },
      ],
    },
    {
      value: "event_time",
      label: "Improve event time",
      fields: [
        { key: "distance_km", label: "Distance (km)", type: "number" },
        {
          key: "target_time_hours",
          label: "Target time (hours)",
          type: "number",
        },
        {
          key: "current_distance_km",
          label: "Current longest ride (km)",
          type: "number",
          optional: true,
        },
        {
          key: "event_name",
          label: "Event name (optional)",
          type: "text",
          optional: true,
        },
      ],
    },
    {
      value: "endurance_base",
      label: "Build endurance (long steady rides)",
      fields: [
        {
          key: "target_weekly_distance_km",
          label: "Target weekly distance (km)",
          type: "number",
        },
        {
          key: "target_heart_rate_zone",
          label: "Target heart rate zone (optional)",
          type: "text",
          optional: true,
        },
      ],
    },
    {
      value: "climbing_improvement",
      label: "Improve climbing",
      fields: [
        {
          key: "current_elevation_gain_m",
          label: "Current elevation gain per ride (m)",
          type: "number",
          optional: true,
        },
        {
          key: "target_elevation_gain_m",
          label: "Target elevation gain per ride (m)",
          type: "number",
        },
      ],
    },
  ],
};
