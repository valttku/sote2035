import { db } from "../db.js";
import { formatHealthEntry } from "./formatHealthStats.js";
import {
  evaluateMetric,
  evaluateStandardRange,
  evaluateGoal,
} from "./evaluateMetrics.js";
import { GoalMetric, HealthData, RawMetric } from "./evaluateMetrics.js";

// This file contains queries related to the health_stat_entries and user_dailies_garmin table

// Main function
export async function getHealthStatEntriesData(
  userId: number,
  date: string,
  part: "heart" | "brain" | "legs" | "lungs",
): Promise<HealthData> {
  const kindByPart: Record<typeof part, string[]> = {
    heart: ["heart_daily"],
    brain: ["sleep_daily", "stress_daily"],
    legs: ["activity_daily"],
    lungs: ["resp_daily"],
  };
  const kinds = kindByPart[part];
  if (!kinds) return {};

  // Fetch today's data
  const result = await db.query(
    `
    SELECT kind, data
    FROM app.health_stat_entries
    WHERE user_id = $1
      AND day_date = $2::date
      AND kind = ANY($3::text[])
    `,
    [userId, date, kinds],
  );

  // Fetch past 7 days for baseline metrics
  const historyRows = await db.query(
    `
    SELECT kind, data
    FROM app.health_stat_entries
    WHERE user_id = $1
      AND day_date < $2::date
      AND day_date >= ($2::date - INTERVAL '7 days')
      AND kind = ANY($3::text[])
    `,
    [userId, date, kinds],
  );

  // Build historical map for numeric metrics
  const historyMap: Record<string, number[]> = {};
  for (const row of historyRows.rows) {
    const formatted = formatHealthEntry(row.kind, row.data);
    for (const [key, value] of Object.entries(formatted)) {
      if (typeof value === "number") {
        if (!historyMap[key]) historyMap[key] = [];
        historyMap[key].push(value);
      }
    }
  }

  const enhancedMetrics: HealthData = {};

  for (const row of result.rows) {
    const formatted = formatHealthEntry(row.kind, row.data);

    for (const [key, value] of Object.entries(formatted)) {
      if (typeof value !== "number") {
        enhancedMetrics[key] = value;
        continue;
      }

      // HRV → baseline evaluation (add later)

      // Sleep → standard range evaluation (7-10h)
      if (row.kind === "sleep_daily") {
        if (key === "Total sleep (h)") {
          enhancedMetrics[key] = {
            value,
            status: evaluateStandardRange(value, 7, 10),
          } as GoalMetric;
        } else {
          enhancedMetrics[key] = { value } as RawMetric;
        }
        continue;
      }

      // COMPARE METRICS WITH GOALS FOR GARMIN USERS
      // Activity → compare to daily goal / weekly goal
      if (
        ["Steps", "Intensity duration (min)", "Floors climbed"].includes(key)
      ) {
        // Fetch goals from user_dailies_garmin
        const daily = await db.query(
          `
          SELECT steps_goal, intensity_duration_goal_in_seconds, floors_climbed_goal
          FROM app.user_dailies_garmin
          WHERE user_id = $1 AND day_date = $2::date
          `,
          [userId, date],
        );
        const goalRow = daily.rows[0] ?? {};

        // Map daily goals
        const goalMap: Record<string, number> = {
          Steps: goalRow.steps_goal ?? 0,
          "Floors climbed": goalRow.floors_climbed_goal ?? 0,
        };

        if (key === "Intensity duration (min)") {
          // Weekly intensity logic
          const weekData = await db.query(
            `SELECT COALESCE(SUM(moderate_intensity_duration_in_seconds + (vigorous_intensity_duration_in_seconds * 2)),0) as total_seconds
            FROM app.user_dailies_garmin
            WHERE user_id = $1
              AND day_date >= date_trunc('week', $2::date)
              AND day_date <= $2::date
            `,
            [userId, date],
          );
          const weeklyTotalMin = (weekData.rows[0]?.total_seconds ?? 0) / 60;

          const weekly_intensity_duration_goal = await db.query(
            `SELECT intensity_duration_goal_in_seconds
            FROM app.user_dailies_garmin
            WHERE user_id = $1
              AND day_date >= date_trunc('week', $2::date)
              AND day_date <= $2::date
            `,
            [userId, date],
          );

          const weeklyGoalMin =
            (weekly_intensity_duration_goal.rows[0]
              ?.intensity_duration_goal_in_seconds ?? 0) / 60;

          enhancedMetrics[key] = {
            value,
            weeklyTotal: weeklyTotalMin,
            weeklyGoal: weeklyGoalMin,
            status: evaluateGoal(weeklyTotalMin, weeklyGoalMin),
          } as GoalMetric;
        } else {
          // daily goals
          enhancedMetrics[key] = {
            value,
            goal: goalMap[key] ?? 0,
            status: evaluateGoal(value, goalMap[key] ?? 0),
          } as GoalMetric;
        }
        continue;
      }

      // fallback: raw value
      enhancedMetrics[key] = { value } as RawMetric;
    }
  }

  return enhancedMetrics;
}
