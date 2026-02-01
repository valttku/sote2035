import { db } from "./db.js";

export type GarminUserMetricRow = {
  user_id: number;
  day_date: string;
  summary_id?: string | null;
  vo2_max?: number | null;
  vo2_max_cycling?: number | null;
  fitness_age?: number | null;
  enhanced?: boolean | null;
};

export function mapGarminUserMetricsToRows(user_id: number, m: any): GarminUserMetricRow {
  return {
    user_id,
    day_date: m.calendarDate,
    summary_id: m.summaryId ?? null,
    vo2_max: m.vo2Max ?? null,
    vo2_max_cycling: m.vo2MaxCycling ?? null,
    fitness_age: m.fitnessAge ?? null,
    enhanced: m.enhanced ?? null,
  };
}

export async function upsertGarminUserMetrics(row: GarminUserMetricRow) {
  if (!row) return;
  
  // Insert or update user metrics
  await db.query(
    `INSERT INTO app.user_metrics_garmin
       (user_id, day_date, summary_id, vo2_max, vo2_max_cycling, fitness_age, enhanced)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (user_id, day_date, summary_id)
     DO UPDATE SET
       vo2_max = EXCLUDED.vo2_max,
       vo2_max_cycling = EXCLUDED.vo2_max_cycling,
       fitness_age = EXCLUDED.fitness_age,
       enhanced = EXCLUDED.enhanced`,
    [
      row.user_id,
      row.day_date,
      row.summary_id,
      row.vo2_max,
      row.vo2_max_cycling,
      row.fitness_age,
      row.enhanced,
    ],
  );
}