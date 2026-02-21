import { db } from "../db.js";
import { extractHealthMetrics } from "./extractHealthMetrics.js";

export type MetricStatus = "low" | "good" | "high" | undefined;
type MetricGoal = { min?: number; max?: number };

type MetricObject = {
  value: string; // formatted
  rawValue: number; // numeric
  goal?: MetricGoal;
  status?: MetricStatus;
  avg7?: {
    raw: number;
    formatted: string;
  };
};
export type HealthData = Record<string, number | MetricObject>;

// Helper to parse numeric values from the formatted metrics.
function parseNumeric(value: string | number): number | null {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const num = parseFloat(value.split("/")[0].trim());
    if (!isNaN(num)) return num;
  }
  return null;
}

// Main function: fetch today's health stat entries for the specified user and part (heart, brain, legs, lungs),
export async function getHealthStatEntriesData(
  userId: number,
  date: string,
  part: "heart" | "brain" | "legs" | "lungs",
): Promise<HealthData> {
  const kindsByPart: Record<typeof part, string[]> = {
    heart: ["heart_daily"],
    brain: ["sleep_daily", "stress_daily"],
    legs: ["activity_daily"],
    lungs: ["resp_daily"],
  };

  const kinds = kindsByPart[part];
  if (!kinds) return {};

  // Fetch today's metrics
  const { rows: todayRows } = await db.query(
    `SELECT kind, data
     FROM app.health_stat_entries
     WHERE user_id = $1
       AND day_date = $2::date
       AND kind = ANY($3::text[])`,
    [userId, date, kinds],
  );

  // Fetch last 7 days for historical comparison
  const { rows: historyRows } = await db.query(
    `SELECT kind, data
     FROM app.health_stat_entries
     WHERE user_id = $1
       AND day_date < $2::date
       AND day_date >= ($2::date - INTERVAL '7 days')
       AND kind = ANY($3::text[])`,
    [userId, date, kinds],
  );

  // `historyMap` now holds arrays of historical numeric values keyed by metric name.
  // Example: { "Resting heart rate": [60, 62, 61], "Steps": [7000, 8000] }
  // We use this map below to compute personalized goals / ranges per metric.
  const historyMap: Record<string, number[]> = {};
  for (const row of historyRows) {
    const metrics = extractHealthMetrics(row.kind, row.data);
    for (const [key, value] of Object.entries(metrics)) {
      const num = parseNumeric(value);
      if (num != null) {
        (historyMap[key] ??= []).push(num);
      }
    }
  }

  const result: HealthData = {};

  for (const row of todayRows) {
    const metrics = extractHealthMetrics(row.kind, row.data);

    for (const [key, value] of Object.entries(metrics)) {
      const numericValue = parseNumeric(value);
      if (numericValue == null) {
        result[key] = value;
        continue;
      }

      // `historical` contains recent values for this metric (last 7 days)
      const historical = historyMap[key] ?? [];

      // Calculate 7-day average including today's value for trend analysis.
      // if no historical data exists, avg7 will be undefined
      const avg7 =
        historical.length > 0
          ? (historical.reduce((a, b) => a + b, 0) + numericValue) /
            (historical.length + 1)
          : undefined;

      // `goal` and `status` are computed per-metric. `goal` is an optional
      // numeric range used to derive the `status` (low/good/high).
      let status: MetricStatus | undefined;
      let goal: MetricGoal | undefined;

      // Activity goals: if minimum goal is achieved, status = good, otherwise low
      // goals are defined from the user's Garmin data when available.
      if (row.kind === "activity_daily") {
        if (key === "Steps" && row.data.steps_goal != null) {
          const min = row.data.steps_goal;
          goal = { min };
          status = numericValue >= min ? "good" : "low";
        }

        if (key === "Floors climbed" && row.data.floors_climbed_goal != null) {
          const min = row.data.floors_climbed_goal;
          goal = { min };
          status = numericValue >= min ? "good" : "low";
        }

        if (
          key === "Intense exercise this week" &&
          row.data.intensity_duration_goal_in_seconds != null
        ) {
          const min = row.data.intensity_duration_goal_in_seconds / 60;
          goal = { min };
          status = numericValue >= min ? "good" : "low";
        }
      }

      // Sleep: if total sleep is between 7-10 hours, status = good,
      // otherwise low or high
      if (row.kind === "sleep_daily" && key === "Total sleep") {
        goal = { min: 7, max: 10 };
      }

      // Stress: high if above 75, otherwise good
      if (row.kind === "stress_daily" && key === "Average stress") {
        goal = { max: 75 };
      }

      // Resting heart rate: personalized ranges when enough history exists
      if (row.kind === "heart_daily" && key === "Resting heart rate") {
        if (historical.length >= 5) {
          const avg = historical.reduce((a, b) => a + b, 0) / historical.length;
          const stdDev = Math.sqrt(
            historical.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) /
              historical.length,
          );
          const spread = Math.max(stdDev, 4); // minimum ±4 bpm
          goal = {
            min: +(avg - spread).toFixed(1),
            max: +(avg + spread).toFixed(1),
          };
        } else {
          goal = { min: 50, max: 90 };
        }
      }

      // Overnight average HRV: personalized ranges when enough history exists
      // HRV can be highly individual, so we use a wide spread if variability is high
      if (row.kind === "heart_daily" && key === "Overnight average HRV") {
        if (historical.length >= 5) {
          const avg = historical.reduce((a, b) => a + b, 0) / historical.length;
          const stdDev = Math.sqrt(
            historical.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) /
              historical.length,
          );
          const spread = Math.max(stdDev, 8);
          goal = {
            min: Math.max(15, avg - 1.5 * spread),
            max: Math.min(180, avg + 1.5 * spread),
          };
        } else {
          goal = { min: 20, max: 120 };
        }
      }

      // Respiratory rate: prefer personalized ranges when enough history exists,
      // otherwise use a standard healthy range.
      if (row.kind === "resp_daily" && key === "Average respiratory rate") {
        if (historical.length >= 5) {
          const avg = historical.reduce((a, b) => a + b, 0) / historical.length;
          const stdDev = Math.sqrt(
            historical.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) /
              historical.length,
          );
          const spread = Math.max(stdDev, 2);

          goal = {
            min: +Math.max(8, avg - 2 * spread).toFixed(2),
            max: +Math.min(25, avg + 2 * spread).toFixed(2),
          };
        } else {
          goal = { min: 12, max: 20 };
        }
      }

      // Convert numericValue to hours for comparison (numericValue is in seconds)
      let valueForGoal = numericValue;
      if (row.kind === "sleep_daily" && key === "Total sleep") {
        valueForGoal = numericValue / 3600; // seconds → hours
      }

      // Calculate status:
      // if min is defined and value is below min, status = low
      // if max is defined and value is above max, status = high
      // if value is within range, status = good
      if (goal) {
        if (goal.min !== undefined && valueForGoal < goal.min) status = "low";
        else if (goal.max !== undefined && valueForGoal > goal.max)
          status = "high";
        else status = "good";
      }

      function formatMinutesHM(totalMinutes: number) {
        const mins = Math.round(totalMinutes);
        const hours = Math.floor(mins / 60);
        const minutes = mins % 60;
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
      }

      function formatMetric(key: string, raw: number) {
        switch (key) {
          case "Total sleep":
            const totalMinutes = Math.round(raw / 60); // seconds → minutes
            return formatMinutesHM(totalMinutes);

          case "Distance":
            return (raw / 1000).toFixed(2) + " km";

          case "Intense exercise this week":
          case "Intense exercise today":
            return Math.round(raw / 60) + " min";

          case "Average respiratory rate":
            return raw.toFixed(2) + " brpm";

          case "Resting heart rate":
          case "Average heart rate":
            return Math.round(raw) + " bpm";

          case "Overnight average HRV":
            return Math.round(raw) + " ms";

          case "Total energy expenditure":
            return Math.round(raw) + " kcal";

          default:
            return Math.round(raw).toString();
        }
      }

      const displayValue = formatMetric(key, numericValue);

      const formattedAvg7 =
        avg7 !== undefined ? formatMetric(key, +avg7.toFixed(2)) : undefined;

      result[key] = {
        rawValue: numericValue,
        value: displayValue,
        goal,
        status,
        avg7:
          formattedAvg7 !== undefined && avg7 !== undefined
            ? { raw: +avg7.toFixed(2), formatted: formattedAvg7 }
            : undefined,
      };

      console.log({
        key,
        value,
        goal,
        historicalLength: historical.length,
        statusBefore: status,
        avg7,
      });
    }
  }

  return result;
}
