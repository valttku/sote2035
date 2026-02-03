import { Router } from "express";
import { db } from "../db/db.js";
import { authRequired } from "../middleware/authRequired.js";

export const calendarRouter = Router();


// GET /api/v1/calendar/month?year=YYYY&month=MM
// Returns only days that have actual activity_daily entries with data

calendarRouter.get("/month", authRequired, async (req, res, next) => {
  try {
    const userId = (req as any).userId as number;
    const year = Number(req.query.year);
    const month = Number(req.query.month);

    if (
      !Number.isInteger(year) ||
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12
    ) {
      return res.status(400).json({ error: "Invalid year/month" });
    }

    // Create month range
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));

    // Query ONLY activity_daily entries
    const result = await db.query(
      `
      SELECT DISTINCT TO_CHAR(day_date, 'YYYY-MM-DD') AS day_date
      FROM app.health_stat_entries
      WHERE user_id = $1
        AND kind = 'activity_daily'
        AND day_date >= $2::date
        AND day_date < $3::date
      ORDER BY day_date ASC
      `,
      [userId, start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)]
    );

    const dates = result.rows.map(r => r.day_date); // already YYYY-MM-DD
    console.log("Month query result:", dates);
    res.json(dates);

  } catch (err) {
    next(err);
  }
});



/**
 * GET /api/v1/calendar/health-stats?date=YYYY-MM-DD
 * Returns health stat entries for a specific date
 */
calendarRouter.get("/health-stats", authRequired, async (req, res, next) => {
  try {
    const userId = (req as any).userId as number;
    const date = typeof req.query.date === "string" ? req.query.date : "";

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: "Invalid date. Use YYYY-MM-DD" });
    }

    const entries = await db.query(
      `
      SELECT id, kind, source, data, created_at
      FROM app.health_stat_entries
      WHERE user_id = $1 AND day_date = $2::date
      ORDER BY created_at ASC
      `,
      [userId, date],
    );

    res.json({ date, entries: entries.rows || [] });
  } catch (e) {
    console.error("Error fetching health stats:", e);
    res.status(500).json({ error: "Failed to fetch health stats" });
  }
});

/**
 * POST /api/v1/calendar/activities
 * Adds a new activity_daily entry
 */

// POST /activities
calendarRouter.post("/activities", authRequired, async (req, res, next) => {
  try {
    const userId = (req as any).userId as number;
    const date = typeof req.query.date === "string" ? req.query.date : "";

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: "Invalid date. Use YYYY-MM-DD" });
    }

    // Get Garmin activities
    const garminActivities = await db.query(
      `
      select id, device_name, activity_name, duration_in_seconds, 
      start_time_in_seconds, start_time_offset_in_seconds,
      average_heart_rate, active_kilocalories, steps, created_at, 'garmin'::text as source_type
      from app.user_activities_garmin
      where user_id = $1 and (to_timestamp(start_time_in_seconds) at time zone 'UTC')::date = $2::date
      `,
      [userId, date],
    );

    // Get manual activities
    const manualActivities = await db.query(
      `
      select id, null::text as device_name, 
             (data->>'title')::text as activity_name,
             ((data->>'duration')::int * 60)::int as duration_in_seconds,
             null::int as start_time_in_seconds,
             null::int as start_time_offset_in_seconds,
             null::int as average_heart_rate,
             ((data->>'calories')::int)::int as active_kilocalories,
             created_at, 'manual'::text as source_type
      from app.health_stat_entries
      where user_id = $1 and day_date = $2::date and kind = 'manual_activity'
      `,
      [userId, date],
    );

    // Get polar activities (to be added)

    // Combine and sort by created_at
    const allEntries = [
      ...garminActivities.rows,
      ...manualActivities.rows,
    ].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );

    res.json({ date, entries: allEntries });
  } catch (err) {
    next(err);
  }
});

// Add a manual activity entry for a given date and user (adds activity to health_stat_entries)
// POST /api/v1/calendar/manual-activities
calendarRouter.post(
  "/manual-activities",
  authRequired,
  async (req, res, next) => {
    try {
      const userId = (req as any).userId as number;
      const { date, title, type, duration, calories, steps} = req.body;

      if (!date || !title)
        return res.status(400).json({ error: "Date and title required" });

    const result = await db.query(
      `
      INSERT INTO app.health_stat_entries (user_id, day_date, kind, source, data)
      VALUES ($1, $2::date, 'activity_daily', 'manual', $3::jsonb)
      ON CONFLICT (user_id, day_date, kind)
      DO UPDATE SET
        data = EXCLUDED.data,
        created_at = now()
      RETURNING TO_CHAR(day_date, 'YYYY-MM-DD') AS day_date, data
      `,
        [userId, date, { title, type, duration, calories, steps}],
      );

    res.json({ success: true, entry: result.rows[0] });

  } catch (err) {
    next(err);
  }
});
