import { db } from "./db.js";

// THIS FILE CONTAINS DB QUERIES RELATED TO health_stat_entries table
// WILL BE DELETED LATER WHEN health_metrics_daily TABLE IS FULLY IN USE

export type HealthData = Record<string, string | number>;

// fetches health data for a given user, date, and body part
export async function getHealthData(
  userId: number,
  date: string,
  part: "heart" | "brain" | "legs" | "lungs",
): Promise<HealthData> {
  const kindByPart: Record<typeof part, string[]> = {
    heart: ["heart_daily"],
    brain: ["sleep_daily"],
    legs: ["activity_daily"],
    lungs: ["resp_daily", "spo2_daily"],
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
    const data = row.data ?? {};

    if (row.kind === "heart_daily") {
      if (data.hr_avg != null) metrics["HR avg"] = data.hr_avg;
      if (data.hrv != null) metrics["HRV"] = data.hrv;
      if (data.rhr != null) metrics["Resting HR"] = data.rhr;
    }

    if (row.kind === "sleep_daily") {
      if (data.duration_min != null)
        metrics["Sleep (h)"] = +(data.duration_min / 60).toFixed(1);
      if (data.score != null) metrics["Sleep score"] = data.score;
    }

    if (row.kind === "activity_daily") {
      if (data.steps != null) metrics["Steps"] = data.steps;
      if (data.training_load != null)
        metrics["Training load"] = data.training_load;
    }

    if (row.kind === "resp_daily" && data.resp_rate != null) {
      metrics["Resp rate"] = data.resp_rate;
    }
  }

  return metrics;
}
