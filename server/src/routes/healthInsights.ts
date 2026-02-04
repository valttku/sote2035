import { Router } from "express";
import { db } from "../db/db.js";
import { authRequired } from "../middleware/authRequired.js";

export const healthInsightsRouter = Router();

// GET /api/v1/health-insights?date=YYYY-MM-DD
healthInsightsRouter.get("/", authRequired, async (req, res, next) => {
  try {
    const userId = (req as any).userId as number;
    const date = typeof req.query.date === "string" ? req.query.date : "";

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: "Invalid date. Use YYYY-MM-DD" });
    }

    // Fetch from all relevant Garmin tables
    const [dailies, sleep, respiration, skinTemp, metrics, hrv] = await Promise.all([
      db.query(`SELECT * FROM app.user_dailies_garmin WHERE user_id = $1 AND day_date = $2::date`, [userId, date]),
      db.query(`SELECT * FROM app.user_sleep_garmin WHERE user_id = $1 AND day_date = $2::date`, [userId, date]),
      db.query(`SELECT * FROM app.user_respiration_garmin WHERE user_id = $1 AND day_date = $2::date`, [userId, date]),
      db.query(`SELECT * FROM app.user_skin_temp_garmin WHERE user_id = $1 AND day_date = $2::date`, [userId, date]),
      db.query(`SELECT * FROM app.user_metrics_garmin WHERE user_id = $1 AND day_date = $2::date`, [userId, date]),
      db.query(`SELECT * FROM app.user_hrv_garmin WHERE user_id = $1 AND day_date = $2::date`, [userId, date]),
    ]);

    const insights = {
      recoveryAndSleep: sleep.rows[0] ? {
        sleepHours: (sleep.rows[0].duration_in_seconds / 3600)?.toFixed(1),
        sleepQuality: sleep.rows[0].overall_sleep_score?.value,
        deepSleep: (sleep.rows[0].deep_sleep_duration_in_seconds / 3600)?.toFixed(1),
        remSleep: (sleep.rows[0].rem_sleep_in_seconds / 3600)?.toFixed(1),
      } : null,
      cardiovascularHealth: {
        restingHeartRate: dailies.rows[0]?.resting_heart_rate,
        heartRateVariability: hrv.rows[0]?.last_night_avg,
        vo2Max: metrics.rows[0]?.vo2_max,
      },
      activityAndMovement: dailies.rows[0] ? {
        steps: dailies.rows[0].steps,
        distance: (dailies.rows[0].distance_in_meters / 1000)?.toFixed(2),
        activeCalories: dailies.rows[0].active_kilocalories,
        floorsClimbed: dailies.rows[0].floors_climbed,
      } : null,
      stressAndReadiness: dailies.rows[0] ? {
        avgStress: dailies.rows[0].avg_stress_level,
        maxStress: dailies.rows[0].max_stress_level,
      } : null,
      respiratory: respiration.rows[0] ? {
        respiratoryRate: respiration.rows[0].avg_waking_respiration_value,
      } : null,
      skinTemperature: skinTemp.rows[0] ? {
        deviation: skinTemp.rows[0].avg_deviation_celsius,
      } : null,
    };

    res.json({ date, insights });
  } catch (e) {
    next(e);
  }
});