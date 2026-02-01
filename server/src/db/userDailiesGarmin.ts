import { db } from "./db.js";

export type GarminDailiesRow = {
  user_id: number;
  day_date: string;
  summary_id?: string | null;
  activity_type?: string | null;
  active_kilocalories?: number | null;
  bmr_kilocalories?: number | null;
  steps?: number | null;
  pushes?: number | null;
  distance_in_meters?: number | null;
  push_distance_in_meters?: number | null;
  duration_in_seconds?: number | null;
  active_time_in_seconds?: number | null;
  floors_climbed?: number | null;
  min_heart_rate?: number | null;
  max_heart_rate?: number | null;
  avg_heart_rate?: number | null;
  resting_heart_rate?: number | null;
  heart_rate_samples?: Record<string, number> | null;
  avg_stress_level?: number | null;
  max_stress_level?: number | null;
  stress_duration_in_seconds?: number | null;
  rest_stress_duration_in_seconds?: number | null;
  activity_stress_duration_in_seconds?: number | null;
  low_stress_duration_in_seconds?: number | null;
  medium_stress_duration_in_seconds?: number | null;
  high_stress_duration_in_seconds?: number | null;
  stress_qualifier?: string | null;
  body_battery_charged?: number | null;
  body_battery_drained?: number | null;
  steps_goal?: number | null;
  pushes_goal?: number | null;
  intensity_duration_goal_in_seconds?: number | null;
  floors_climbed_goal?: number | null;
  start_time_in_seconds?: number | null;
  start_time_offset_in_seconds?: number | null;
};

export function mapGarminDailiesToRows(
  user_id: number,
  d: any,
): GarminDailiesRow[] {
  return [
    {
      user_id,
      day_date: d.calendarDate,
      summary_id: d.summaryId ?? null,
      activity_type: d.activityType ?? null,
      active_kilocalories: d.activeKilocalories ?? null,
      bmr_kilocalories: d.bmrKilocalories ?? null,
      steps: d.steps ?? null,
      pushes: d.pushes ?? null,
      distance_in_meters: d.distanceInMeters ?? null,
      push_distance_in_meters: d.pushDistanceInMeters ?? null,
      duration_in_seconds: d.durationInSeconds ?? null,
      active_time_in_seconds: d.activeTimeInSeconds ?? null,
      floors_climbed: d.floorsClimbed ?? null,
      min_heart_rate: d.minHeartRateInBeatsPerMinute ?? null,
      max_heart_rate: d.maxHeartRateInBeatsPerMinute ?? null,
      avg_heart_rate: d.averageHeartRateInBeatsPerMinute ?? null,
      resting_heart_rate: d.restingHeartRateInBeatsPerMinute ?? null,
      heart_rate_samples: d.timeOffsetHeartRateSamples ?? null,
      avg_stress_level: d.averageStressLevel ?? null,
      max_stress_level: d.maxStressLevel ?? null,
      stress_duration_in_seconds: d.stressDurationInSeconds ?? null,
      rest_stress_duration_in_seconds: d.restStressDurationInSeconds ?? null,
      activity_stress_duration_in_seconds:
        d.activityStressDurationInSeconds ?? null,
      low_stress_duration_in_seconds: d.lowStressDurationInSeconds ?? null,
      medium_stress_duration_in_seconds:
        d.mediumStressDurationInSeconds ?? null,
      high_stress_duration_in_seconds: d.highStressDurationInSeconds ?? null,
      stress_qualifier: d.stressQualifier ?? null,
      body_battery_charged: d.bodyBatteryChargedValue ?? null,
      body_battery_drained: d.bodyBatteryDrainedValue ?? null,
      steps_goal: d.stepsGoal ?? null,
      pushes_goal: d.pushesGoal ?? null,
      intensity_duration_goal_in_seconds:
        d.intensityDurationGoalInSeconds ?? null,
      floors_climbed_goal: d.floorsClimbedGoal ?? null,
      start_time_in_seconds: d.startTimeInSeconds ?? null,
      start_time_offset_in_seconds: d.startTimeOffsetInSeconds ?? null,
    },
  ];
}

export async function upsertGarminDailies(rows: GarminDailiesRow[]) {
  if (!rows.length) return;

  // Insert dailies
  const columns = [
    "user_id",
    "day_date",
    "summary_id",
    "activity_type",
    "active_kilocalories",
    "bmr_kilocalories",
    "steps",
    "pushes",
    "distance_in_meters",
    "push_distance_in_meters",
    "duration_in_seconds",
    "active_time_in_seconds",
    "floors_climbed",
    "min_heart_rate",
    "max_heart_rate",
    "avg_heart_rate",
    "resting_heart_rate",
    "heart_rate_samples",
    "avg_stress_level",
    "max_stress_level",
    "stress_duration_in_seconds",
    "rest_stress_duration_in_seconds",
    "activity_stress_duration_in_seconds",
    "low_stress_duration_in_seconds",
    "medium_stress_duration_in_seconds",
    "high_stress_duration_in_seconds",
    "stress_qualifier",
    "body_battery_charged",
    "body_battery_drained",
    "steps_goal",
    "pushes_goal",
    "intensity_duration_goal_in_seconds",
    "floors_climbed_goal",
    "start_time_in_seconds",
    "start_time_offset_in_seconds",
  ];

  const values: any[] = [];
  const placeholders: string[] = [];

  rows.forEach((r, i) => {
    const base = i * columns.length;
    const placeholderList = columns
      .map((_, j) => `$${base + j + 1}`)
      .join(", ");
    placeholders.push(`(${placeholderList})`);

    values.push(
      r.user_id,
      r.day_date,
      r.summary_id ?? null,
      r.activity_type ?? null,
      r.active_kilocalories ?? null,
      r.bmr_kilocalories ?? null,
      r.steps ?? null,
      r.pushes ?? null,
      r.distance_in_meters ?? null,
      r.push_distance_in_meters ?? null,
      r.duration_in_seconds ?? null,
      r.active_time_in_seconds ?? null,
      r.floors_climbed ?? null,
      r.min_heart_rate ?? null,
      r.max_heart_rate ?? null,
      r.avg_heart_rate ?? null,
      r.resting_heart_rate ?? null,
      r.heart_rate_samples ? JSON.stringify(r.heart_rate_samples) : null,
      r.avg_stress_level ?? null,
      r.max_stress_level ?? null,
      r.stress_duration_in_seconds ?? null,
      r.rest_stress_duration_in_seconds ?? null,
      r.activity_stress_duration_in_seconds ?? null,
      r.low_stress_duration_in_seconds ?? null,
      r.medium_stress_duration_in_seconds ?? null,
      r.high_stress_duration_in_seconds ?? null,
      r.stress_qualifier ?? null,
      r.body_battery_charged ?? null,
      r.body_battery_drained ?? null,
      r.steps_goal ?? null,
      r.pushes_goal ?? null,
      r.intensity_duration_goal_in_seconds ?? null,
      r.floors_climbed_goal ?? null,
      r.start_time_in_seconds ?? null,
      r.start_time_offset_in_seconds ?? null,
    );
  });

  const query = `
    INSERT INTO app.user_dailies_garmin (${columns.join(", ")})
    VALUES ${placeholders.join(", ")}
    ON CONFLICT (user_id, day_date)
    DO UPDATE SET
      summary_id = EXCLUDED.summary_id,
      activity_type = EXCLUDED.activity_type,
      active_kilocalories = EXCLUDED.active_kilocalories,
      steps = EXCLUDED.steps,
      distance_in_meters = EXCLUDED.distance_in_meters,
      avg_stress_level = EXCLUDED.avg_stress_level,
      body_battery_charged = EXCLUDED.body_battery_charged,
      updated_at = now()
  `;

  await db.query(query, values);
}

// ...existing code...

export async function getGarminDailiesByUser(
  user_id: number,
  limit = 30,
): Promise<GarminDailiesRow[]> {
  const { rows } = await db.query<GarminDailiesRow>(
    `SELECT
       user_id,
       day_date,
       summary_id,
       activity_type,
       active_kilocalories,
       bmr_kilocalories,
       steps,
       pushes,
       distance_in_meters,
       push_distance_in_meters,
       duration_in_seconds,
       active_time_in_seconds,
       floors_climbed,
       min_heart_rate,
       max_heart_rate,
       avg_heart_rate,
       resting_heart_rate,
       heart_rate_samples,
       avg_stress_level,
       max_stress_level,
       stress_duration_in_seconds,
       rest_stress_duration_in_seconds,
       activity_stress_duration_in_seconds,
       low_stress_duration_in_seconds,
       medium_stress_duration_in_seconds,
       high_stress_duration_in_seconds,
       stress_qualifier,
       body_battery_charged,
       body_battery_drained,
       steps_goal,
       pushes_goal,
       intensity_duration_goal_in_seconds,
       floors_climbed_goal,
       start_time_in_seconds,
       start_time_offset_in_seconds
     FROM app.user_dailies_garmin
     WHERE user_id = $1
     ORDER BY day_date DESC
     LIMIT $2`,
    [user_id, limit],
  );

  return rows;
}
