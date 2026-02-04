import { db } from "./db.js";

// This file contains queries related to the health_stat_entries table

export type HealthData = Record<string, string | number>;

// fetches health data for a given user, date, and body part
export async function getHealthData(
  userId: number,
  date: string,
  part: "heart" | "brain" | "legs" | "lungs",
): Promise<HealthData> {
  const kindByPart: Record<typeof part, string[]> = {
    heart: ["heart_daily"],
    brain: ["sleep_daily", "stress_daily"],
    legs: ["activity_daily"],
    lungs: ["resp_daily", "skin_temp_daily"],
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
      if (data.hr_avg != null) metrics["Average heart rate"] = data.hr_avg;
      if (data.rhr != null) metrics["Resting heart rate"] = data.rhr;
      if (data.hr_max != null) metrics["Max heart rate"] = data.hr_max;
      if (data.hr_min != null) metrics["Min heart rate"] = data.hr_min;
    }

    if (row.kind === "sleep_daily") {
      if (data.duration_min != null)
        metrics["Sleep (h)"] = +(data.duration_min / 60).toFixed(1);
      if (data.score != null) metrics["Sleep score"] = data.score;
    }

    if (row.kind === "activity_daily") {
      if (data.steps != null) metrics["Steps"] = data.steps;
      if (data.distance_meters != null)
        metrics["Distance (km)"] = +(data.distance_meters / 1000).toFixed(2);
      if (data.active_kcal != null) metrics["Active kcal"] = data.active_kcal;
      if (data.total_kcal != null) metrics["Total kcal"] = data.total_kcal;
      if (data.floors_climbed != null)
        metrics["Floors climbed"] = data.floors_climbed;
      if (data.intensity_duration_seconds != null)
        metrics["Intensity duration (min)"] = +(
          data.intensity_duration_seconds / 60
        ).toFixed(1);
    }

    if (row.kind === "resp_daily" && data.resp_rate != null) {
      metrics["Respiratory rate"] = data.resp_rate;
    }

    if (row.kind === "stress_daily") {
      if (data.stress_avg != null) metrics["Average stress"] = data.stress_avg;
      if (data.stress_max != null) metrics["Max stress"] = data.stress_max;
    }
    if (row.kind === "skin_temp_daily" && data.skin_temp != null) {
      metrics["Skin temp (°C)"] = data.skin_temp;
    }
  }

  return metrics;
}
