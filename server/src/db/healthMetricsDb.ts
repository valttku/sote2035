import { db } from "./db.js";
// This file contains database queries for the health_metrics_daily table

// representing daily health metrics for users from various sources
export type HealthMetricRow = {
  user_id: number;
  day_date: string;
  source: "garmin" | "polar";
  metric: string;
  value_number?: number | null;
  value_json?: Record<string, any> | null;
  unit?: string | null;
};

// maps Garmin user metrics object to HealthMetricRow array
export function mapUserMetricsToRows(
  user_id: number,
  m: any,
): HealthMetricRow[] {
  const metricMap: Record<string, { metric: string; unit?: string }> = {
    vo2Max: { metric: "vo2_max", unit: "ml/kg/min" },
    vo2MaxCycling: { metric: "vo2_max_cycling", unit: "ml/kg/min" },
    fitnessAge: { metric: "fitness_age", unit: "years" },
    enhanced: { metric: "metrics_enhanced" },
  };

  return Object.entries(metricMap)
    .filter(([key]) => m[key] != null)
    .map(([key, { metric, unit }]) => ({
      user_id,
      day_date: m.calendarDate,
      source: "garmin" as const,
      metric,
      value_number: typeof m[key] === "number" ? m[key] : null,
      value_json: typeof m[key] !== "number" ? { value: m[key] } : null,
      unit: unit ?? null,
    }));
}

// inserts or updates health metrics in the health_metrics_daily table
export async function upsertHealthMetrics(rows: HealthMetricRow[]) {
  if (!rows.length) return;

  // 1. Ensure health_days records exist
  const dates = [...new Set(rows.map((r) => r.day_date))];
  for (const date of dates) {
    const userId = rows.find((r) => r.day_date === date)!.user_id;
    await db.query(
      `INSERT INTO app.health_days (user_id, day_date)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [userId, date],
    );
  }

  // 2. Insert metrics
  const values: any[] = [];
  const placeholders: string[] = [];

  rows.forEach((r, i) => {
    const base = i * 7;
    placeholders.push(
      `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7})`,
    );

    values.push(
      r.user_id,
      r.day_date,
      r.source,
      r.metric,
      r.value_number ?? null,
      r.value_json ? JSON.stringify(r.value_json) : null,
      r.unit ?? null,
    );
  });

  const query = `
    INSERT INTO app.health_metrics_daily
      (user_id, day_date, source, metric, value_number, value_json, unit)
    VALUES ${placeholders.join(", ")}
    ON CONFLICT (user_id, day_date, source, metric)
    DO UPDATE SET
      value_number = EXCLUDED.value_number,
      value_json   = EXCLUDED.value_json,
      unit         = EXCLUDED.unit,
      created_at   = now()
  `;

  await db.query(query, values);
}

// fetches health metrics for a given user over a date range
export async function getHealthMetricsRange(
  user_id: number,
  start_date: string,
  end_date: string,
) {
  const result = await db.query(
    `
    SELECT day_date, metric, value_number, value_json, unit
    FROM app.health_metrics_daily
    WHERE user_id = $1 AND day_date BETWEEN $2 AND $3
    ORDER BY day_date ASC
    `,
    [user_id, start_date, end_date],
  );

  const metrics: Record<string, any[]> = {};

  for (const row of result.rows) {
    if (!metrics[row.metric]) metrics[row.metric] = [];

    metrics[row.metric].push({
      day_date: row.day_date,
      value: row.value_number ?? row.value_json,
      unit: row.unit,
    });
  }

  return metrics;
}

// deletes health metrics for a given user and source
export async function deleteHealthMetricsForSource(
  user_id: number,
  source: "garmin" | "polar",
) {
  await db.query(
    `
    DELETE FROM app.health_metrics_daily
    WHERE user_id = $1 AND source = $2
    `,
    [user_id, source],
  );
}
