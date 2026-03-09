import { db } from "../db.js";

export type PolarNightlyRechargeRow = {
  user_id: number;
  day_date: string;                           // YYYY-MM-DD
  heart_rate_avg: number | null;              // avg overnight HR (≈ resting HR)
  beat_to_beat_avg: number | null;            // avg RR interval in ms
  heart_rate_variability_avg: number | null;  // avg HRV (RMSSD) in ms
  breathing_rate_avg: number | null;          // avg overnight breathing rate
  ans_charge: number | null;                  // Polar's ANS charge score (fractional)
  ans_rate: string | null;                    // "RECOVERING" | "STEADY" | "ACTIVATED"
  source: string;
};

// Maps Polar's nightly-recharge API response to a DB row.
// Polar nightly recharge response fields: date, heart_rate_avg, beat_to_beat_avg,
// heart_rate_variability_avg, breathing_rate_avg, ans_charge, ans_rate
export function mapPolarNightlyRechargeToRow(
  user_id: number,
  n: any
): PolarNightlyRechargeRow {
  return {
    user_id,
    day_date: n.date,
    heart_rate_avg: n.heart_rate_avg ?? null,
    beat_to_beat_avg: n.beat_to_beat_avg ?? null,
    heart_rate_variability_avg: n.heart_rate_variability_avg ?? null,
    breathing_rate_avg: n.breathing_rate_avg ?? null,
    ans_charge: n.ans_charge ?? null,
    ans_rate: n.ans_rate ?? null,
    source: "polar",
  };
}

export async function upsertPolarNightlyRecharge(row: PolarNightlyRechargeRow) {
  if (!row || !row.day_date) return;

  await db.query(
    `INSERT INTO app.user_nightly_recharge_polar
       (user_id, day_date, heart_rate_avg, beat_to_beat_avg,
        heart_rate_variability_avg, breathing_rate_avg, ans_charge, ans_rate, source)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (user_id, day_date)
     DO UPDATE SET
       heart_rate_avg = EXCLUDED.heart_rate_avg,
       beat_to_beat_avg = EXCLUDED.beat_to_beat_avg,
       heart_rate_variability_avg = EXCLUDED.heart_rate_variability_avg,
       breathing_rate_avg = EXCLUDED.breathing_rate_avg,
       ans_charge = EXCLUDED.ans_charge,
       ans_rate = EXCLUDED.ans_rate,
       updated_at = now()`,
    [
      row.user_id,
      row.day_date,
      row.heart_rate_avg,
      row.beat_to_beat_avg,
      row.heart_rate_variability_avg,
      row.breathing_rate_avg,
      row.ans_charge,
      row.ans_rate,
      row.source,
    ]
  );
}
