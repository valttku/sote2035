import { db } from "./db.js";
// THIS FILE WILL CONTAIN DB QUERIES RELATED TO health_metrics_daily table

type MetricRow = {
  user_id: number;
  day_date: string;
  source: "polar" | "garmin" | "mock";
  metric: string;
  value_number?: number;
  value_json?: Record<string, any>;
  unit?: string;
};

/*inserts health metrics from Garmin or Polar for a given user and date
to the health_metrics_daily table in the database*/
export async function upsertHealthMetrics(rows: MetricRow[]) {
  if (rows.length === 0) return;

  const values: any[] = [];
  const placeholders: string[] = [];

  rows.forEach((r, i) => {
    placeholders.push(
      `($${i * 7 + 1}, $${i * 7 + 2}, $${i * 7 + 3}, $${i * 7 + 4}, $${i * 7 + 5}, $${i * 7 + 6}, $${i * 7 + 7})`,
    );
    values.push(
      r.user_id,
      r.day_date,
      r.source,
      r.metric,
      r.value_number ?? null,
      r.value_json ?? null,
      r.unit ?? null,
    );
  });

  const query = `
    INSERT INTO app.health_metrics_daily
      (user_id, day_date, source, metric, value_number, value_json, unit)
    VALUES ${placeholders.join(", ")}
    ON CONFLICT (user_id, day_date, source, metric) DO UPDATE
      SET value_number = excluded.value_number,
          value_json = excluded.value_json,
          unit = excluded.unit
  `;

  await db.query(query, values);
}

/*retrieves health metrics for a given user and date
from the health_metrics_daily table in the database
Returns a map of metric -> value (number or JSON)*/
export async function getHealthMetrics(
  user_id: number,
  day_date: string,
): Promise<Record<string, number | Record<string, any>>> {
  const result = await db.query(
    `
  SELECT metric, value_number, value_json
  FROM app.health_metrics_daily
  WHERE user_id = $1 AND day_date = $2
  `,
    [user_id, day_date],
  );

  const metrics: Record<string, any> = {};
  for (const row of result.rows) {
    metrics[row.metric] = row.value_number ?? row.value_json;
  }

  return metrics;
}

/*retrieves health metrics for a given user over a date range
from the health_metrics_daily table in the database*/
export async function getHealthMetricsRange(
  user_id: number,
  start_date: string,
  end_date: string,
): Promise<
  Record<
    string,
    Array<{ day_date: string; value: number | Record<string, any> }>
  >
> {
  const result = await db.query(
    `
  SELECT day_date, metric, value_number, value_json
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
    });
  }

  return metrics;
}

/* delete health metrics if a user inlinks their Poalr or Garminaccount*/
export async function deleteHealthMetrics(
  user_id: number,
  day_date: string,
  source?: string,
) {}
