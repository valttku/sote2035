import { Router } from "express";
import { db } from "../db/db.js";
import { authRequired } from "../middleware/authRequired.js";

export const calendarRouter = Router();

// GET /api/v1/calendar/month?year=2026&month=1
// Returns: ["2026-01-03", "2026-01-07", ...]
calendarRouter.get("/month", authRequired, async (req, res, next) => {
  try {
    const userId = (req as any).userId as number;

    const year = Number(req.query.year);
    const month = Number(req.query.month); // 1-12

    if (
      !Number.isInteger(year) ||
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12
    ) {
      return res.status(400).json({ error: "Invalid year/month" });
    }

    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));

    // Query health_days for this user and month
    const result = await db.query(
      `
      select to_char(day_date, 'YYYY-MM-DD') as day_date
      from app.health_days
      where user_id = $1
        and day_date >= $2::date
        and day_date < $3::date
      order by day_date asc
      `,
      [userId, start.toISOString(), end.toISOString()],
    );

    res.json(result.rows.map((r) => r.day_date));
  } catch (e) {
    next(e);
  }
});

// Get health stats entries for a given date and user
// GET /api/v1/calendar/health-stats?date=YYYY-MM-DD
calendarRouter.get("/health-stats", authRequired, async (req, res, next) => {
  try {
    const userId = (req as any).userId as number;
    const date = typeof req.query.date === "string" ? req.query.date : "";

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: "Invalid date. Use YYYY-MM-DD" });
    }

    const entries = await db.query(
      `
      select id, kind, source, data, created_at
      from app.health_stat_entries
      where user_id = $1 and day_date = $2::date
      order by created_at asc
      `,
      [userId, date],
    );

    res.json({ date, entries: entries.rows });
  } catch (e) {
    next(e);
  }
});

// Get Garmin activities (and polar in future) for a given date and user
// GET /api/v1/calendar/activities?date=YYYY-MM-DD
calendarRouter.get("/activities", authRequired, async (req, res, next) => {
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

    // Get polar activities (to be added)

    // Combine and sort by created_at
    const allEntries = [...garminActivities.rows].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );

    res.json({ date, entries: allEntries });
  } catch (err) {
    next(err);
  }
});

// Add a manual activity entry for a given date and user (adds manual_activity to health_stat_entries)
// POST /api/v1/calendar/manual-activities
calendarRouter.post(
  "/manual-activities",
  authRequired,
  async (req, res, next) => {
    try {
      const userId = (req as any).userId as number;
      const { date, title, type, duration, calories, steps } = req.body;

      if (!date || !title)
        return res.status(400).json({ error: "Date and title required" });

      // Insert as manual_activity entry
      const result = await db.query(
        `
      INSERT INTO app.health_stat_entries (user_id, day_date, kind, source, data)
      VALUES ($1, $2, 'manual_activity', 'manual', $3)
      RETURNING *
      `,
        [userId, date, { title, type, duration, calories, steps }],
      );

      res.json({ success: true, entry: result.rows[0] });
    } catch (err) {
      next(err);
    }
  },
);

// Delete a manual activity entry from health_stat_entries by id
// DELETE /api/v1/calendar/manual-activities/:id
calendarRouter.delete(
  "/manual-activities/:id",
  authRequired,
  async (req, res, next) => {
    try {
      const userId = (req as any).userId as number;
      const entryId = req.params.id;

      // Delete only manual_activity entries owned by this user
      const result = await db.query(
        `
      DELETE FROM app.health_stat_entries
      WHERE id = $1 and user_id = $2 and kind = 'manual_activity'
      RETURNING *
      `,
        [entryId, userId],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Manual activity not found" });
      }

      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },
);
