import { db } from "./db.js";
// THIS FILE WILL CONTAIN DB QUERIES RELATED TO health_metrics_daily table


type ActivityRow = {
  user_id: number;
  day_date: string;
  source: string;
  start_time: Date;
  end_time: Date;
  duration_seconds: number;
  distance_meters: number;
  calories: number;
  steps: number;
  heart_rate_zones: Record<string, any>;
  inactive_seconds: number;
};

export async function upsertUserActivities(rows: ActivityRow[]) {
  if (!rows.length) return;

  const values: any[] = [];
  const placeholders: string[] = [];

  rows.forEach((r, i) => {
    placeholders.push(
      `($${i * 11 + 1}, $${i * 11 + 2}, $${i * 11 + 3}, $${i * 11 + 4}, $${i * 11 + 5}, $${i * 11 + 6}, $${i * 11 + 7}, $${i * 11 + 8}, $${i * 11 + 9}, $${i * 11 + 10}, $${i * 11 + 11})`
    );
    values.push(
      r.user_id,
      r.day_date,
      r.source,
      r.start_time,
      r.end_time,
      r.duration_seconds,
      r.distance_meters,
      r.calories,
      r.steps,
      JSON.stringify(r.heart_rate_zones),
      r.inactive_seconds
    );
  });

  const query = `
    INSERT INTO app.user_activities
      (user_id, day_date, source, start_time, end_time, duration_seconds, distance_meters, calories, steps, heart_rate_zones, inactive_seconds)
    VALUES ${placeholders.join(", ")}
    ON CONFLICT (user_id, day_date, source, start_time)
    DO UPDATE SET
      end_time = excluded.end_time,
      duration_seconds = excluded.duration_seconds,
      distance_meters = excluded.distance_meters,
      calories = excluded.calories,
      steps = excluded.steps,
      heart_rate_zones = excluded.heart_rate_zones,
      inactive_seconds = excluded.inactive_seconds
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
