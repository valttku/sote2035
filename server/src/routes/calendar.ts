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

    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
      return res.status(400).json({ error: "Invalid year/month" });
    }

    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));

    const result = await db.query(
      `
      select day_date
      from app.health_days
      where user_id = $1
        and day_date >= $2::date
        and day_date < $3::date
      order by day_date asc
      `,
      [userId, start.toISOString(), end.toISOString()]
    );

    res.json(result.rows.map(r => String(r.day_date)));
  } catch (e) {
    next(e);
  }
});

// GET /api/v1/calendar/health-stats?date=YYYY-MM-DD
// Returns: { date, entries: [...] } (entries can be empty)
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
      [userId, date]
    );

    res.json({ date, entries: entries.rows });
  } catch (e) {
    next(e);
  }
});

// POST /api/v1/calendar/activities
calendarRouter.post("/activities", authRequired, async (req, res, next) => {
  try {
    const userId = (req as any).userId as number;
    const { date, title, type, duration, calories, steps, notes } = req.body;

    if (!date || !title) return res.status(400).json({ error: "Date and title required" });

    // Insert as activity_daily entry for modal compatibility
    const result = await db.query(
      `
      INSERT INTO app.health_stat_entries (user_id, day_date, kind, source, data)
      VALUES ($1, $2, 'activity_daily', 'manual', $3)
      RETURNING *
      `,
      [userId, date, { title, type, duration, calories, steps, notes }]
    );

    res.json({ success: true, entry: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

