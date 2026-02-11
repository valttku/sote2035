import { db } from "../db.js";
import { formatHealthEntry } from "./formatHealthStats.js";

// This file contains queries related to the health_stat_entries table

export type HealthData = Record<string, string | number>;

// fetches health_stat_entries data for a given user, date, and body part
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

  const metrics: HealthData = {};

  for (const row of result.rows) {
    const formatted = formatHealthEntry(row.kind, row.data);
    Object.assign(metrics, formatted);
  }
  return metrics;
}
