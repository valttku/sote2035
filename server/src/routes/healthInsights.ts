import { Router } from "express";
import { db } from "../db/db.js";
import { authRequired } from "../middleware/authRequired.js";

export const healthInsightsRouter = Router();

// GET /api/v1/health-insights/garmin?date=YYYY-MM-DD
healthInsightsRouter.get("/garmin", authRequired, async (req, res, next) => {
  try {
    const userId = (req as any).userId as number;

    // Get date from query params, default to today
    const date =
      typeof req.query.date === "string"
        ? req.query.date
        : new Date().toISOString().split("T")[0];

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res
        .status(400)
        .json({ error: "Invalid date format. Use YYYY-MM-DD" });
    }

    console.log(`[health-insights] user=${userId} date=${date}`);

    // Fetch body composition data
    //const bodyCompResult = await db.query(
    //  `SELECT * FROM app.user_body_composition_garmin
    //   WHERE user_id = $1 AND day_date = $2::date`,
    //  [userId, date],
    //);

    // Fetch activities
    const activitiesResult = await db.query(
      `SELECT * FROM app.user_activities_garmin 
       WHERE user_id = $1 
       AND DATE(to_timestamp(start_time_in_seconds)) = $2::date
       ORDER BY start_time_in_seconds DESC`,
      [userId, date],
    );

    // Fetch sleep data
    const sleepResult = await db.query(
      `SELECT * FROM app.user_sleep_garmin 
       WHERE user_id = $1 AND day_date = $2::date`,
      [userId, date],
    );

    // Fetch stress data
    const stressResult = await db.query(
      `SELECT * FROM app.user_stress_garmin 
       WHERE user_id = $1 AND day_date = $2::date`,
      [userId, date],
    );

    // Fetch heart rate data
    const heartRateResult = await db.query(
      `SELECT * FROM app.user_hrv_garmin
       WHERE user_id = $1 AND day_date = $2::date`,
      [userId, date],
    );

    // Fetch dailies data
    const dailiesResult = await db.query(
      `SELECT * FROM app.user_dailies_garmin 
       WHERE user_id = $1 AND day_date = $2::date`,
      [userId, date],
    );

    const insights = {
      date,
      activities: activitiesResult.rows,
      sleep: sleepResult.rows,
      stress: stressResult.rows,
      heartRate: heartRateResult.rows,
      dailies: dailiesResult.rows,
    };

    res.json(insights);
  } catch (e) {
    next(e);
  }
});
