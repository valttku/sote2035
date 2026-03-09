import { db } from "../db.js";
import { extractHealthMetrics } from "./extractHealthMetrics.js";

export type MetricStatus = "low" | "good" | "high" | undefined;
type MetricGoal = { min?: number; max?: number };
type MetricObject = {
  value: string;    // formatted
  rawValue: number; // numeric
  goal?: MetricGoal;
  status?: MetricStatus;
  avg7?: { raw: number; formatted: string };
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

const placeholderMetricsByPart: Record<"heart" | "brain" | "legs" | "lungs", string[]> = {
  heart: ["Resting heart rate", "Overnight average HRV"],
  brain: ["Total sleep", "Average stress"],
  legs:  ["Steps", "Distance", "Intense exercise today", "Intense exercise this week", "Floors climbed"],
  lungs: ["Average respiratory rate"],
};

function createPlaceholderMetric(): MetricObject {
  return { rawValue: 0, value: "—" };
}

// ─── Per-part raw fetchers ────────────────────────────────────────────────────

async function fetchHeartToday(userId: number, date: string) {
  const [gDaily, gHrv, pRecharge] = await Promise.all([
    db.query(`SELECT avg_heart_rate, resting_heart_rate FROM app.user_dailies_garmin WHERE user_id=$1 AND day_date=$2`, [userId, date]),
    db.query(`SELECT last_night_avg FROM app.user_hrv_garmin WHERE user_id=$1 AND day_date=$2`, [userId, date]),
    db.query(`SELECT heart_rate_avg, heart_rate_variability_avg FROM app.user_nightly_recharge_polar WHERE user_id=$1 AND day_date=$2`, [userId, date]),
  ]);
  const g = gDaily.rows[0], h = gHrv.rows[0], p = pRecharge.rows[0];
  if (!g && !h && !p) return [];
  return [{ kind: "heart_daily", data: {
    hr_avg:            g?.avg_heart_rate            ?? null,
    rhr:               g?.resting_heart_rate         ?? p?.heart_rate_avg ?? null,
    overnight_avg_hrv: h?.last_night_avg             ?? p?.heart_rate_variability_avg ?? null,
  }}];
}

async function fetchHeartHistory(userId: number, date: string) {
  const [gDaily, gHrv, pRecharge] = await Promise.all([
    db.query(`SELECT day_date, avg_heart_rate, resting_heart_rate FROM app.user_dailies_garmin WHERE user_id=$1 AND day_date < $2::date AND day_date >= $2::date - INTERVAL '7 days'`, [userId, date]),
    db.query(`SELECT day_date, last_night_avg FROM app.user_hrv_garmin WHERE user_id=$1 AND day_date < $2::date AND day_date >= $2::date - INTERVAL '7 days'`, [userId, date]),
    db.query(`SELECT day_date, heart_rate_avg, heart_rate_variability_avg FROM app.user_nightly_recharge_polar WHERE user_id=$1 AND day_date < $2::date AND day_date >= $2::date - INTERVAL '7 days'`, [userId, date]),
  ]);
  const byDay = new Map<string, any>();
  for (const r of gDaily.rows)    byDay.set(String(r.day_date), { hr_avg: r.avg_heart_rate, rhr: r.resting_heart_rate });
  for (const r of gHrv.rows)      byDay.set(String(r.day_date), { ...(byDay.get(String(r.day_date)) ?? {}), overnight_avg_hrv: r.last_night_avg });
  for (const r of pRecharge.rows) {
    const d = String(r.day_date), ex = byDay.get(d) ?? {};
    byDay.set(d, { ...ex, rhr: ex.rhr ?? r.heart_rate_avg, overnight_avg_hrv: ex.overnight_avg_hrv ?? r.heart_rate_variability_avg });
  }
  return Array.from(byDay.values()).map(data => ({ kind: "heart_daily", data }));
}

async function fetchBrainToday(userId: number, date: string) {
  const [gSleep, pSleep, gDaily] = await Promise.all([
    db.query(`SELECT duration_in_seconds FROM app.user_sleeps_garmin WHERE user_id=$1 AND day_date=$2`, [userId, date]),
    db.query(`SELECT light_sleep_seconds, deep_sleep_seconds, rem_sleep_seconds FROM app.user_sleeps_polar WHERE user_id=$1 AND day_date=$2`, [userId, date]),
    db.query(`SELECT avg_stress_level, stress_qualifier FROM app.user_dailies_garmin WHERE user_id=$1 AND day_date=$2`, [userId, date]),
  ]);
  const gs = gSleep.rows[0], ps = pSleep.rows[0], gd = gDaily.rows[0];
  const rows: Array<{kind: string, data: any}> = [];
  const sleepSec = gs?.duration_in_seconds ?? (ps
    ? (ps.light_sleep_seconds ?? 0) + (ps.deep_sleep_seconds ?? 0) + (ps.rem_sleep_seconds ?? 0) || null
    : null);
  if (sleepSec != null) rows.push({ kind: "sleep_daily", data: { duration_seconds: sleepSec } });
  if (gd?.avg_stress_level != null) rows.push({ kind: "stress_daily", data: { stress_avg: gd.avg_stress_level, stress_qualifier: gd.stress_qualifier } });
  return rows;
}

async function fetchBrainHistory(userId: number, date: string) {
  const [gSleep, pSleep, gDaily] = await Promise.all([
    db.query(`SELECT duration_in_seconds FROM app.user_sleeps_garmin WHERE user_id=$1 AND day_date < $2::date AND day_date >= $2::date - INTERVAL '7 days'`, [userId, date]),
    db.query(`SELECT light_sleep_seconds, deep_sleep_seconds, rem_sleep_seconds FROM app.user_sleeps_polar WHERE user_id=$1 AND day_date < $2::date AND day_date >= $2::date - INTERVAL '7 days'`, [userId, date]),
    db.query(`SELECT avg_stress_level FROM app.user_dailies_garmin WHERE user_id=$1 AND day_date < $2::date AND day_date >= $2::date - INTERVAL '7 days'`, [userId, date]),
  ]);
  const rows: Array<{kind: string, data: any}> = [];
  for (const r of gSleep.rows) rows.push({ kind: "sleep_daily", data: { duration_seconds: r.duration_in_seconds } });
  for (const r of pSleep.rows) {
    const total = (r.light_sleep_seconds ?? 0) + (r.deep_sleep_seconds ?? 0) + (r.rem_sleep_seconds ?? 0);
    if (total > 0) rows.push({ kind: "sleep_daily", data: { duration_seconds: total } });
  }
  for (const r of gDaily.rows) if (r.avg_stress_level != null) rows.push({ kind: "stress_daily", data: { stress_avg: r.avg_stress_level } });
  return rows;
}

async function fetchLegsToday(userId: number, date: string) {
  const [gDaily, pActivity, pExercise, pWeekly, gWeekly] = await Promise.all([
    db.query(`SELECT steps, steps_goal, floors_climbed, floors_climbed_goal, distance_in_meters, active_kilocalories, bmr_kilocalories, moderate_intensity_duration_in_seconds, vigorous_intensity_duration_in_seconds, intensity_duration_goal_in_seconds FROM app.user_dailies_garmin WHERE user_id=$1 AND day_date=$2`, [userId, date]),
    db.query(`SELECT steps, distance_in_meters, calories FROM app.user_activity_summaries_polar WHERE user_id=$1 AND day_date=$2`, [userId, date]),
    db.query(`SELECT COALESCE(SUM(duration_in_seconds),0) AS total_duration, COALESCE(SUM(calories),0) AS total_calories, COALESCE(SUM(distance_in_meters),0) AS total_distance FROM app.user_exercises_polar WHERE user_id=$1 AND day_date=$2`, [userId, date]),
    db.query(`SELECT COALESCE(SUM(duration_in_seconds),0) AS weekly FROM app.user_exercises_polar WHERE user_id=$1 AND day_date >= date_trunc('week',$2::date)::date AND day_date <= $2::date`, [userId, date]),
    db.query(`SELECT COALESCE(SUM(moderate_intensity_duration_in_seconds + (vigorous_intensity_duration_in_seconds * 2)),0) AS weekly FROM app.user_dailies_garmin WHERE user_id=$1 AND day_date >= date_trunc('week',$2::date)::date AND day_date <= $2::date`, [userId, date]),
  ]);
  const g = gDaily.rows[0], pa = pActivity.rows[0], pe = pExercise.rows[0];
  if (!g && !pa && !Number(pe?.total_duration)) return [];
  if (g) return [{ kind: "activity_daily", data: {
    steps: g.steps, steps_goal: g.steps_goal,
    floors_climbed: g.floors_climbed, floors_climbed_goal: g.floors_climbed_goal,
    distance_meters: g.distance_in_meters,
    total_kcal: (g.active_kilocalories ?? 0) + (g.bmr_kilocalories ?? 0),
    intensity_duration_seconds: (g.moderate_intensity_duration_in_seconds ?? 0) + (g.vigorous_intensity_duration_in_seconds ?? 0) * 2,
    intensity_duration_goal_in_seconds: g.intensity_duration_goal_in_seconds,
    weekly_intensity_total_seconds: Number(gWeekly.rows[0]?.weekly ?? 0),
  }}];
  return [{ kind: "activity_daily", data: {
    steps: pa?.steps ?? null,
    distance_meters: pa?.distance_in_meters ?? Number(pe?.total_distance) ?? null,
    total_kcal: pa?.calories ?? Number(pe?.total_calories) ?? null,
    intensity_duration_seconds: Number(pe?.total_duration) || null,
    weekly_intensity_total_seconds: Number(pWeekly.rows[0]?.weekly ?? 0),
  }}];
}

async function fetchLegsHistory(userId: number, date: string) {
  const [gDaily, pActivity, pExercise] = await Promise.all([
    db.query(`SELECT steps, distance_in_meters, active_kilocalories, bmr_kilocalories, moderate_intensity_duration_in_seconds, vigorous_intensity_duration_in_seconds FROM app.user_dailies_garmin WHERE user_id=$1 AND day_date < $2::date AND day_date >= $2::date - INTERVAL '7 days'`, [userId, date]),
    db.query(`SELECT steps, distance_in_meters, calories FROM app.user_activity_summaries_polar WHERE user_id=$1 AND day_date < $2::date AND day_date >= $2::date - INTERVAL '7 days'`, [userId, date]),
    db.query(`SELECT day_date, SUM(duration_in_seconds) AS total_duration FROM app.user_exercises_polar WHERE user_id=$1 AND day_date < $2::date AND day_date >= $2::date - INTERVAL '7 days' GROUP BY day_date`, [userId, date]),
  ]);
  const rows: Array<{kind: string, data: any}> = [];
  for (const r of gDaily.rows) rows.push({ kind: "activity_daily", data: { steps: r.steps, distance_meters: r.distance_in_meters, total_kcal: (r.active_kilocalories ?? 0) + (r.bmr_kilocalories ?? 0), intensity_duration_seconds: (r.moderate_intensity_duration_in_seconds ?? 0) + (r.vigorous_intensity_duration_in_seconds ?? 0) * 2 } });
  const peByDay = new Map(pExercise.rows.map((r: any) => [String(r.day_date), r]));
  for (const r of pActivity.rows) rows.push({ kind: "activity_daily", data: { steps: r.steps, distance_meters: r.distance_in_meters, total_kcal: r.calories, intensity_duration_seconds: Number(peByDay.get(String(r.day_date))?.total_duration) || null } });
  return rows;
}

async function fetchLungsToday(userId: number, date: string) {
  const [gResp, pRecharge] = await Promise.all([
    db.query(`SELECT round(avg(value::double precision)::numeric,2) AS rate FROM app.user_respiration_garmin, jsonb_each_text(time_offset_epoch_to_breaths) WHERE user_id=$1 AND day_date=$2`, [userId, date]),
    db.query(`SELECT breathing_rate_avg FROM app.user_nightly_recharge_polar WHERE user_id=$1 AND day_date=$2`, [userId, date]),
  ]);
  const rate = gResp.rows[0]?.rate ?? pRecharge.rows[0]?.breathing_rate_avg ?? null;
  if (rate == null) return [];
  return [{ kind: "resp_daily", data: { resp_rate: Number(rate) } }];
}

async function fetchLungsHistory(userId: number, date: string) {
  const [gResp, pRecharge] = await Promise.all([
    db.query(`SELECT round(avg(value::double precision)::numeric,2) AS rate FROM app.user_respiration_garmin, jsonb_each_text(time_offset_epoch_to_breaths) WHERE user_id=$1 AND day_date < $2::date AND day_date >= $2::date - INTERVAL '7 days' GROUP BY day_date`, [userId, date]),
    db.query(`SELECT breathing_rate_avg FROM app.user_nightly_recharge_polar WHERE user_id=$1 AND day_date < $2::date AND day_date >= $2::date - INTERVAL '7 days'`, [userId, date]),
  ]);
  const rows: Array<{kind: string, data: any}> = [];
  for (const r of gResp.rows)    rows.push({ kind: "resp_daily", data: { resp_rate: Number(r.rate) } });
  for (const r of pRecharge.rows) rows.push({ kind: "resp_daily", data: { resp_rate: Number(r.breathing_rate_avg) } });
  return rows;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function getHealthStatEntriesData(
  userId: number,
  date: string,
  part: "heart" | "brain" | "legs" | "lungs",
): Promise<HealthData> {
  const fetchers = {
    heart: [fetchHeartToday, fetchHeartHistory],
    brain: [fetchBrainToday, fetchBrainHistory],
    legs:  [fetchLegsToday,  fetchLegsHistory],
    lungs: [fetchLungsToday, fetchLungsHistory],
  } as const;

  const [todayRows, historyRows] = await Promise.all([
    fetchers[part][0](userId, date),
    fetchers[part][1](userId, date),
  ]);

  if (todayRows.length === 0) {
    const placeholders: HealthData = {};
    for (const key of placeholderMetricsByPart[part]) placeholders[key] = createPlaceholderMetric();
    return placeholders;
  }

  // Build history map: metric name → array of past values
  const historyMap: Record<string, number[]> = {};
  for (const row of historyRows) {
    for (const [key, value] of Object.entries(extractHealthMetrics(row.kind, row.data))) {
      const num = parseNumeric(value);
      if (num != null) (historyMap[key] ??= []).push(num);
    }
  }

  function fmt(key: string, raw: number): string {
    switch (key) {
      case "Total sleep":           { const m = Math.round(raw / 60); return `${Math.floor(m / 60)}h ${m % 60}m`; }
      case "Distance":              return (raw / 1000).toFixed(2) + " km";
      case "Intense exercise this week":
      case "Intense exercise today": return Math.round(raw / 60) + " min";
      case "Average respiratory rate": return raw.toFixed() + " brpm";
      case "Resting heart rate":
      case "Average heart rate":    return Math.round(raw) + " bpm";
      case "Overnight average HRV": return Math.round(raw) + " ms";
      case "Total energy expenditure": return Math.round(raw) + " kcal";
      default:                      return Math.round(raw).toString();
    }
  }

  const result: HealthData = {};

  for (const row of todayRows) {
    for (const [key, value] of Object.entries(extractHealthMetrics(row.kind, row.data))) {
      const numericValue = parseNumeric(value);
      if (numericValue == null) { result[key] = value; continue; }

      const historical = historyMap[key] ?? [];
      const avg7 = historical.length >= 7
        ? (historical.reduce((a, b) => a + b, 0) + numericValue) / (historical.length + 1)
        : undefined;

      let status: MetricStatus;
      let goal: MetricGoal | undefined;
      let valueForGoal = numericValue;

      if (row.kind === "activity_daily") {
        if (key === "Steps" && row.data.steps_goal != null) {
          goal = { min: row.data.steps_goal };
        }
        if (key === "Floors climbed" && row.data.floors_climbed_goal != null) {
          goal = { min: row.data.floors_climbed_goal };
        }
        if (key === "Intense exercise this week" && row.data.intensity_duration_goal_in_seconds != null) {
          goal = { min: Math.round(row.data.intensity_duration_goal_in_seconds / 60) };
          valueForGoal = Math.round(numericValue / 60);
        }
      }

      if (row.kind === "sleep_daily" && key === "Total sleep") {
        goal = { min: 7, max: 10 };
        valueForGoal = numericValue / 3600;
      }

      if (row.kind === "stress_daily" && key === "Average stress") {
        goal = { max: 75 };
      }

      if (row.kind === "heart_daily" && key === "Resting heart rate") {
        if (historical.length >= 7) {
          const avg = historical.reduce((a, b) => a + b, 0) / historical.length;
          const spread = Math.max(Math.sqrt(historical.reduce((s, v) => s + (v - avg) ** 2, 0) / historical.length), 4);
          goal = { min: +(avg - spread).toFixed(1), max: +(avg + spread).toFixed(1) };
        } else {
          goal = { min: 50, max: 90 };
        }
      }

      if (row.kind === "heart_daily" && key === "Overnight average HRV") {
        if (historical.length >= 7) {
          const avg = historical.reduce((a, b) => a + b, 0) / historical.length;
          const spread = Math.max(Math.sqrt(historical.reduce((s, v) => s + (v - avg) ** 2, 0) / historical.length), 8);
          goal = { min: Math.max(15, avg - 1.5 * spread), max: Math.min(180, avg + 1.5 * spread) };
        } else {
          goal = { min: 20, max: 120 };
        }
      }

      if (row.kind === "resp_daily" && key === "Average respiratory rate") {
        if (historical.length >= 5) {
          const avg = historical.reduce((a, b) => a + b, 0) / historical.length;
          const spread = Math.max(Math.sqrt(historical.reduce((s, v) => s + (v - avg) ** 2, 0) / historical.length), 2);
          goal = { min: +Math.max(8, avg - 2 * spread).toFixed(0), max: +Math.min(25, avg + 2 * spread).toFixed(0) };
        } else {
          goal = { min: 12, max: 20 };
        }
      }

      if (goal) {
        if      (goal.min !== undefined && valueForGoal < goal.min) status = "low";
        else if (goal.max !== undefined && valueForGoal > goal.max) status = "high";
        else status = "good";
      }

      result[key] = {
        rawValue: numericValue,
        value: fmt(key, numericValue),
        goal,
        status,
        avg7: avg7 !== undefined ? { raw: +avg7.toFixed(2), formatted: fmt(key, +avg7.toFixed(2)) } : undefined,
      };
    }
  }

  return result;
}