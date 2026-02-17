import { db } from "../db.js";
import { formatHealthEntry } from "./formatHealthStats.js";

export type MetricStatus = "low" | "good" | "high" | undefined;

type MetricGoal = { min?: number; max?: number };

export type MetricObject = {
  value: number | string;
  goal?: MetricGoal;
  status?: MetricStatus;
};

export type HealthData = Record<string, number | MetricObject>;

function parseNumeric(value: string | number): number | null {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const num = parseFloat(value.split("/")[0].trim());
    if (!isNaN(num)) return num;
  }
  return null;
}

function formatMinutesHM(totalMinutes: number) {
  const mins = Math.round(totalMinutes);
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

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

  const historyMap: Record<string, number[]> = {};
  for (const row of historyRows) {
    const metrics = formatHealthEntry(row.kind, row.data);
    for (const [key, value] of Object.entries(metrics)) {
      const num = parseNumeric(value);
      if (num != null) {
        (historyMap[key] ??= []).push(num);
      }
    }
  }

  const result: HealthData = {};

  for (const row of todayRows) {
    const metrics = formatHealthEntry(row.kind, row.data);

    for (const [key, value] of Object.entries(metrics)) {
      const numericValue = parseNumeric(value);
      if (numericValue == null) {
        result[key] = value;
        continue;
      }

      const historical = historyMap[key] ?? [];

      let min: number | undefined;
      let max: number | undefined;

      if (historical.length) {
        const avg = historical.reduce((a, b) => a + b, 0) / historical.length;
        const stdDev =
          Math.sqrt(
            historical.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) /
              historical.length,
          ) || 0;

        min = avg - stdDev;
        max = avg + stdDev;
      }

      let status: MetricStatus | undefined;
      let goal: MetricGoal | undefined;

      // Activity goals: if minimum goal is achieved, status = good, otherwise low
      if (row.kind === "activity_daily") {
        if (key === "Steps" && row.data.steps_goal != null) {
          const min = row.data.steps_goal;
          goal = { min };
          status = numericValue >= min ? "good" : "low";
          result[key] = { value: numericValue, goal, status };
        }

        if (key === "Floors climbed" && row.data.floors_climbed_goal != null) {
          const min = row.data.floors_climbed_goal;
          goal = { min };
          status = numericValue >= min ? "good" : "low";
          result[key] = { value: numericValue, goal, status };
        }

        if (
          key === "Intensity duration this week (min)" &&
          row.data.intensity_duration_goal_in_seconds != null
        ) {
          const min = row.data.intensity_duration_goal_in_seconds / 60;
          goal = { min };
          status = numericValue >= min ? "good" : "low";
          result[key] = { value: numericValue, goal, status };
        }
      }

      // Sleep: if total sleep is between 7-10 hours, status = good, otherwise low or high
      if (row.kind === "sleep_daily" && key === "Total sleep") {
        goal = { min: 7 * 60, max: 10 * 60 };
      }

      // Stress: high if above 75, otherwise good
      if (row.kind === "stress_daily" && key === "Average stress") {
        goal = { max: 75 };
      }

      // Resting heart rate range is personalized if we have enough historical data,
      // otherwise a general range is used (55-80 bpm)
      if (row.kind === "heart_daily" && key === "Resting heart rate") {
        if (historical.length >= 7) {
          const avg = historical.reduce((a, b) => a + b, 0) / historical.length;
          const stdDev = Math.sqrt(
            historical.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) /
              historical.length,
          );
          goal = {
            min: +(avg - stdDev).toFixed(2),
            max: +(avg + stdDev).toFixed(2),
          };
        } else {
          goal = { min: 55, max: 80 };
        }
      }

      // Respiratory rate: if we have enough historical data, use personalized range,
      // otherwise use general range of 12-20 breaths/min
      if (
        row.kind === "resp_daily" &&
        key === "Average respiratory rate (breaths/min)"
      ) {
        if (historical.length >= 7) {
          const avg = historical.reduce((a, b) => a + b, 0) / historical.length;
          const stdDev = Math.sqrt(
            historical.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) /
              historical.length,
          );

          goal = {
            min: Math.max(8, avg - 2 * stdDev),
            max: Math.min(25, avg + 2 * stdDev),
          };
        } else {
          goal = { min: 12, max: 20 };
        }
      }

      // Calculate status
      if (goal) {
        // if min is defined and value is below min, status = low
        if (goal.min !== undefined && numericValue < goal.min) status = "low";
        // if max is defined and value is above max, status = high
        else if (goal.max !== undefined && numericValue > goal.max)
          status = "high";
        // if value is within range, status = good
        else status = "good";
      }

      // Format display value
      let displayValue: number | string;

      if (key === "Total sleep") {
        displayValue = formatMinutesHM(numericValue);
      } else if (key === "Average respiratory rate (breaths/min)") {
        displayValue = +numericValue.toFixed(2);
      } else if (key === "Resting heart rate") {
        displayValue = +numericValue.toFixed(2);
      } else if (goal?.min !== undefined) {
        displayValue = `${numericValue} / ${goal.min}`;
      } else {
        displayValue = numericValue;
      }

      // goal object stays numeric only
      result[key] = { value: displayValue, goal, status };

      console.log({
        key,
        numericValue,
        goal,
        historicalLength: historical.length,
        statusBefore: status,
      });
    }
  }

  return result;
}
