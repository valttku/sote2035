import { Router } from "express";
import { db } from "../db/db.js";
import { authRequired } from "../middleware/authRequired.js";

export const calendarRouter = Router();

// ─── Month view ───────────────────────────────────────────────────────────────
// GET /api/v1/calendar/month?year=2026&month=1
// Returns dates that have any health data: ["2026-01-03", ...]
calendarRouter.get("/month", authRequired, async (req, res, next) => {
  try {
    const userId = (req as any).userId as number;
    const year = Number(req.query.year);
    const month = Number(req.query.month);
    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12)
      return res.status(400).json({ error: "Invalid year/month" });

    const start = new Date(Date.UTC(year, month - 1, 1));
    const end   = new Date(Date.UTC(year, month, 1));

    // Union across all raw tables to find days that have any data
    const result = await db.query(
      `SELECT DISTINCT to_char(day_date, 'YYYY-MM-DD') AS day_date FROM (
        SELECT day_date FROM app.user_dailies_garmin         WHERE user_id=$1 AND day_date >= $2 AND day_date < $3
        UNION
        SELECT day_date FROM app.user_sleeps_garmin          WHERE user_id=$1 AND day_date >= $2 AND day_date < $3
        UNION
        SELECT day_date FROM app.user_respiration_garmin     WHERE user_id=$1 AND day_date >= $2 AND day_date < $3
        UNION
        SELECT day_date FROM app.user_hrv_garmin             WHERE user_id=$1 AND day_date >= $2 AND day_date < $3
        UNION
        SELECT (to_timestamp(start_time_in_seconds) AT TIME ZONE 'UTC')::date AS day_date
          FROM app.user_activities_garmin
          WHERE user_id=$1
            AND (to_timestamp(start_time_in_seconds) AT TIME ZONE 'UTC')::date >= $2
            AND (to_timestamp(start_time_in_seconds) AT TIME ZONE 'UTC')::date < $3
        UNION
        SELECT day_date FROM app.user_exercises_polar          WHERE user_id=$1 AND day_date >= $2 AND day_date < $3
        UNION
        SELECT day_date FROM app.user_activity_summaries_polar WHERE user_id=$1 AND day_date >= $2 AND day_date < $3
        UNION
        SELECT day_date FROM app.user_sleeps_polar             WHERE user_id=$1 AND day_date >= $2 AND day_date < $3
        UNION
        SELECT day_date FROM app.user_nightly_recharge_polar   WHERE user_id=$1 AND day_date >= $2 AND day_date < $3
        UNION
        SELECT day_date FROM app.user_manual_activities        WHERE user_id=$1 AND day_date >= $2 AND day_date < $3
      ) t
      ORDER BY day_date ASC`,
      [userId, start.toISOString(), end.toISOString()],
    );

    res.json(result.rows.map((r) => r.day_date));
  } catch (e) {
    next(e);
  }
});

// ─── Health stats for a date ──────────────────────────────────────────────────
// GET /api/v1/calendar/health-stats?date=YYYY-MM-DD
// Returns structured daily health data from all raw tables
calendarRouter.get("/health-stats", authRequired, async (req, res, next) => {
  try {
    const userId = (req as any).userId as number;
    const date = typeof req.query.date === "string" ? req.query.date : "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
      return res.status(400).json({ error: "Invalid date. Use YYYY-MM-DD" });

    const [gDaily, gSleep, gResp, gHrv, pActivity, pSleep, pRecharge] = await Promise.all([
      db.query(`SELECT avg_heart_rate, resting_heart_rate, steps, distance_in_meters, active_kilocalories, bmr_kilocalories, avg_stress_level, stress_qualifier, moderate_intensity_duration_in_seconds, vigorous_intensity_duration_in_seconds FROM app.user_dailies_garmin WHERE user_id=$1 AND day_date=$2`, [userId, date]),
      db.query(`SELECT duration_in_seconds, deep_sleep_in_seconds, light_sleep_in_seconds, rem_sleep_in_seconds, overall_sleep_score FROM app.user_sleeps_garmin WHERE user_id=$1 AND day_date=$2`, [userId, date]),
      db.query(`SELECT round(avg(value::double precision)::numeric,2) AS resp_rate FROM app.user_respiration_garmin, jsonb_each_text(time_offset_epoch_to_breaths) WHERE user_id=$1 AND day_date=$2`, [userId, date]),
      db.query(`SELECT last_night_avg AS overnight_avg_hrv FROM app.user_hrv_garmin WHERE user_id=$1 AND day_date=$2`, [userId, date]),
      db.query(`SELECT steps, distance_in_meters, calories, active_calories FROM app.user_activity_summaries_polar WHERE user_id=$1 AND day_date=$2`, [userId, date]),
      db.query(`SELECT light_sleep_seconds, deep_sleep_seconds, rem_sleep_seconds, sleep_score, continuity FROM app.user_sleeps_polar WHERE user_id=$1 AND day_date=$2`, [userId, date]),
      db.query(`SELECT heart_rate_avg, heart_rate_variability_avg, breathing_rate_avg, ans_charge, ans_rate FROM app.user_nightly_recharge_polar WHERE user_id=$1 AND day_date=$2`, [userId, date]),
    ]);

    const g  = gDaily.rows[0];
    const gs = gSleep.rows[0];
    const gr = gResp.rows[0];
    const gh = gHrv.rows[0];
    const pa = pActivity.rows[0];
    const ps = pSleep.rows[0];
    const pr = pRecharge.rows[0];

    const entries: Array<{id: string, kind: string, source: string, data: Record<string, any>}> = [];

    // Heart
    const heartData: Record<string, any> = {};
    if (g?.avg_heart_rate    != null) heartData["Average heart rate"]   = g.avg_heart_rate;
    if (g?.resting_heart_rate != null) heartData["Resting heart rate"]  = g.resting_heart_rate;
    else if (pr?.heart_rate_avg != null) heartData["Resting heart rate"] = pr.heart_rate_avg;
    const hrv = gh?.overnight_avg_hrv ?? pr?.heart_rate_variability_avg ?? null;
    if (hrv != null) heartData["Overnight average HRV"] = hrv;
    if (Object.keys(heartData).length)
      entries.push({ id: "heart_daily", kind: "heart_daily", source: g ? "Garmin" : "Polar", data: heartData });

    // Sleep
    const sleepData: Record<string, any> = {};
    if (gs) {
      sleepData["Total sleep"] = gs.duration_in_seconds;
      if (gs.deep_sleep_in_seconds  != null) sleepData["Deep sleep"]  = gs.deep_sleep_in_seconds;
      if (gs.light_sleep_in_seconds != null) sleepData["Light sleep"] = gs.light_sleep_in_seconds;
      if (gs.rem_sleep_in_seconds   != null) sleepData["REM sleep"]   = gs.rem_sleep_in_seconds;
    } else if (ps) {
      const total = (ps.light_sleep_seconds ?? 0) + (ps.deep_sleep_seconds ?? 0) + (ps.rem_sleep_seconds ?? 0);
      sleepData["Total sleep"]  = total;
      if (ps.deep_sleep_seconds  != null) sleepData["Deep sleep"]  = ps.deep_sleep_seconds;
      if (ps.light_sleep_seconds != null) sleepData["Light sleep"] = ps.light_sleep_seconds;
      if (ps.rem_sleep_seconds   != null) sleepData["REM sleep"]   = ps.rem_sleep_seconds;
      if (ps.sleep_score         != null) sleepData["Sleep score"]  = ps.sleep_score;
      if (ps.continuity          != null) sleepData["Continuity"]   = ps.continuity;
    }
    if (Object.keys(sleepData).length)
      entries.push({ id: "sleep_daily", kind: "sleep_daily", source: gs ? "Garmin" : "Polar", data: sleepData });

    // Activity
    const actData: Record<string, any> = {};
    if (g) {
      if (g.steps != null)              actData["Steps"]    = g.steps;
      if (g.distance_in_meters != null) actData["Distance"] = g.distance_in_meters;
      const kcal = (g.active_kilocalories ?? 0) + (g.bmr_kilocalories ?? 0);
      if (kcal) actData["Total energy expenditure"] = kcal;
      const intensity = (g.moderate_intensity_duration_in_seconds ?? 0) + (g.vigorous_intensity_duration_in_seconds ?? 0) * 2;
      if (intensity) actData["Intense exercise today"] = intensity;
    } else if (pa) {
      if (pa.steps != null)              actData["Steps"]    = pa.steps;
      if (pa.distance_in_meters != null) actData["Distance"] = pa.distance_in_meters;
      if (pa.calories != null)           actData["Total energy expenditure"] = pa.calories;
    }
    if (Object.keys(actData).length)
      entries.push({ id: "activity_daily", kind: "activity_daily", source: g ? "Garmin" : "Polar", data: actData });

    // Stress (Garmin only)
    if (g?.avg_stress_level != null)
      entries.push({ id: "stress_daily", kind: "stress_daily", source: "Garmin", data: { "Average stress": g.avg_stress_level, "Stress qualifier": g.stress_qualifier } });

    // Respiration — aggregate always returns a row; check the value, not the row
    const respRate = (gr?.resp_rate != null ? gr.resp_rate : null) ?? pr?.breathing_rate_avg ?? null;
    if (respRate != null)
      entries.push({ id: "resp_daily", kind: "resp_daily", source: gr?.resp_rate != null ? "Garmin" : "Polar", data: { "Average respiratory rate": Number(respRate) } });

    // ANS / Nightly Recharge (Polar only)
    if (pr?.ans_charge != null)
      entries.push({ id: "nightly_recharge", kind: "nightly_recharge", source: "Polar", data: { "ANS charge": pr.ans_charge, "ANS rate": pr.ans_rate } });

    res.json({ date, entries });
  } catch (e) {
    next(e);
  }
});

// ─── Activities for a date ────────────────────────────────────────────────────
// GET /api/v1/calendar/activities?date=YYYY-MM-DD
calendarRouter.get("/activities", authRequired, async (req, res, next) => {
  try {
    const userId = (req as any).userId as number;
    const date = typeof req.query.date === "string" ? req.query.date : "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
      return res.status(400).json({ error: "Invalid date. Use YYYY-MM-DD" });

    const [garmin, polar] = await Promise.all([
      db.query(
        `SELECT id, device_name, activity_name, duration_in_seconds,
                start_time_in_seconds, start_time_offset_in_seconds,
                average_heart_rate, active_kilocalories, steps, created_at,
                'Garmin' AS source_type
         FROM app.user_activities_garmin
         WHERE user_id=$1 AND (to_timestamp(start_time_in_seconds) AT TIME ZONE 'UTC')::date = $2::date`,
        [userId, date],
      ),
      db.query(
        `SELECT id, device AS device_name, COALESCE(detailed_sport_info, sport) AS activity_name,
                duration_in_seconds, NULL::bigint AS start_time_in_seconds,
                start_time_utc_offset AS start_time_offset_in_seconds,
                avg_heart_rate AS average_heart_rate, calories AS active_kilocalories,
                NULL::integer AS steps, created_at,
                'Polar' AS source_type,
                start_time, sport
         FROM app.user_exercises_polar
         WHERE user_id=$1 AND day_date=$2::date`,
        [userId, date],
      ),
    ]);

    const entries = [...garmin.rows, ...polar.rows].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );

    res.json({ date, entries });
  } catch (e) {
    next(e);
  }
});

// ─── Manual activities ────────────────────────────────────────────────────────
// GET /api/v1/calendar/manual-activities?date=YYYY-MM-DD
calendarRouter.get("/manual-activities", authRequired, async (req, res, next) => {
  try {
    const userId = (req as any).userId as number;
    const date = typeof req.query.date === "string" ? req.query.date : "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
      return res.status(400).json({ error: "Invalid date. Use YYYY-MM-DD" });

    const result = await db.query(
      `SELECT id, title, type, duration, calories, steps, created_at
       FROM app.user_manual_activities
       WHERE user_id=$1 AND day_date=$2::date
       ORDER BY created_at ASC`,
      [userId, date],
    );

    // Return in HealthStatsEntry shape so the client HealthStatsList component can render it
    const entries = result.rows.map((r) => ({
      id: r.id,
      kind: "manual_activity",
      source: "manual",
      created_at: r.created_at,
      data: {
        title:    r.title,
        type:     r.type,
        duration: r.duration,
        calories: r.calories,
        steps:    r.steps,
      },
    }));
    res.json({ date, entries });
  } catch (e) {
    next(e);
  }
});

// POST /api/v1/calendar/manual-activities
calendarRouter.post("/manual-activities", authRequired, async (req, res, next) => {
  try {
    const userId = (req as any).userId as number;
    const { date, title, type, duration, calories, steps } = req.body;
    if (!date || !title)
      return res.status(400).json({ error: "Date and title required" });

    const result = await db.query(
      `INSERT INTO app.user_manual_activities (user_id, day_date, title, type, duration, calories, steps)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, date, title, type ?? null, duration ?? null, calories ?? null, steps ?? null],
    );
    res.json({ success: true, entry: result.rows[0] });
  } catch (e) {
    next(e);
  }
});

// DELETE /api/v1/calendar/manual-activities/:id
calendarRouter.delete("/manual-activities/:id", authRequired, async (req, res, next) => {
  try {
    const userId = (req as any).userId as number;
    const result = await db.query(
      `DELETE FROM app.user_manual_activities WHERE id=$1 AND user_id=$2 RETURNING *`,
      [req.params.id, userId],
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Manual activity not found" });
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});
