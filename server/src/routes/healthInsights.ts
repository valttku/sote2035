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

    // Fetch body composition data
    //const bodyCompResult = await db.query(
    //  `SELECT * FROM app.user_body_composition_garmin
    //   WHERE user_id = $1 AND day_date = $2::date`,
    //  [userId, date],
    //);

    console.log(`[health-insights] user=${userId} date=${date}`);

    // Fetch activities
    const activitiesResult = await db.query(
      `SELECT * FROM app.user_activities_garmin 
       WHERE user_id = $1 
       AND DATE(to_timestamp(start_time_in_seconds)) = $2::date
       ORDER BY start_time_in_seconds DESC`,
      [userId, date],
    );
    console.log(`[health-insights] Activities fetched:`, activitiesResult.rows);

    // Fetch sleep data
    const sleepResult = await db.query(
      `SELECT * FROM app.user_sleep_garmin 
       WHERE user_id = $1 AND day_date = $2::date`,
      [userId, date],
    );
    console.log(`[health-insights] Sleep data fetched:`, sleepResult.rows);

    // Fetch stress data
    const stressResult = await db.query(
      `SELECT * FROM app.user_stress_garmin 
       WHERE user_id = $1 AND day_date = $2::date`,
      [userId, date],
    );
    console.log(`[health-insights] Stress data fetched:`, stressResult.rows);

    // Fetch heart rate data
    const heartRateResult = await db.query(
      `SELECT * FROM app.user_hrv_garmin
       WHERE user_id = $1 AND day_date = $2::date`,
      [userId, date],
    );
    console.log(
      `[health-insights] Heart rate data fetched:`,
      heartRateResult.rows,
    );

    // Fetch dailies data
    const dailiesResult = await db.query(
      `SELECT id, user_id, day_date, summary_id, active_kilocalories, 
           bmr_kilocalories, steps, distance_in_meters,  
          active_time_in_seconds, floors_climbed,  
          avg_heart_rate, resting_heart_rate, avg_stress_level, 
          body_battery_charged, body_battery_drained, steps_goal, 
          moderate_intensity_duration_in_seconds, 
          vigorous_intensity_duration_in_seconds,
          floors_climbed_goal, source, created_at, updated_at
        FROM app.user_dailies_garmin 
        WHERE user_id = $1 AND day_date = $2::date`,
      [userId, date],
    );
    console.log(
      `[health-insights] Dailies data fetched (without heart_rate_samples):`,
      dailiesResult.rows,
    );

    // Fetch user profile
    const profileResult = await db.query(
      `SELECT id, height, weight, gender
      FROM app.users
      WHERE id = $1`,
      [userId],
    );
    console.log(`[health-insights] User profile fetched:`, profileResult.rows);

    const insights = {
      date,
      activities: activitiesResult.rows,
      sleep: sleepResult.rows,
      stress: stressResult.rows,
      heartRate: heartRateResult.rows,
      dailies: dailiesResult.rows,
      profile: profileResult.rows[0],
    };

    res.json(insights);
  } catch (e) {
    next(e);
  }
});
