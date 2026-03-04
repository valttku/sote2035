/**
 * polarBackfill.ts
 *
 * Fetches all recent/available data from Polar AccessLink for a given user.
 * Called immediately after a user connects their Polar account so data appears
 * right away without waiting for webhook events.
 *
 * Polar non-transactional endpoints (no transaction needed, data isn't consumed):
 *   GET /v3/exercises              → last 30 days of exercises (Bearer token)
 *   GET /v3/users/activities       → last 28 days of daily activity (Bearer token)
 *   GET /v3/users/{id}/sleep       → all available sleep nights (Bearer token)
 *   GET /v3/users/{id}/nightly-recharge → all available recharge data (Bearer token)
 *
 * NOTE: Exercises only return sessions uploaded AFTER the user registered with
 * your AccessLink client. Sleep and nightly recharge return all available data.
 */

import {
  mapPolarExerciseToRow,
  upsertPolarExercise,
} from "../db/polarTables/exercisesDb.js";
import {
  mapPolarActivitySummaryToRow,
  upsertPolarActivitySummary,
} from "../db/polarTables/activitySummaryDb.js";
import {
  mapPolarSleepToRow,
  upsertPolarSleep,
} from "../db/polarTables/sleepDb.js";
import {
  mapPolarNightlyRechargeToRow,
  upsertPolarNightlyRecharge,
} from "../db/polarTables/nightlyRechargeDb.js";

const BASE = "https://www.polaraccesslink.com";

async function polarGet(path: string, accessToken: string): Promise<any | null> {
  const url = `${BASE}${path}`;
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    // 204 = no data available — not an error
    if (res.status === 204) return null;

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[polar-backfill] GET ${path} → ${res.status}: ${body}`);
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error(`[polar-backfill] GET ${path} threw:`, err);
    return null;
  }
}

export async function backfillPolarData(
  user_id: number,
  polarUserId: string,
  accessToken: string
): Promise<void> {
  console.log(
    `[polar-backfill] Starting for user_id=${user_id} polar_user_id=${polarUserId}`
  );

  // ── 1. Exercises — last 30 days ──────────────────────────────────────────
  // Array of exercise objects, each with id, start_time, duration, calories, etc.
  try {
    const exercises = await polarGet("/v3/exercises", accessToken);
    const list = Array.isArray(exercises) ? exercises : [];
    console.log(`[polar-backfill] ${list.length} exercises fetched`);
    for (const e of list) {
      const row = mapPolarExerciseToRow(user_id, e);
      if (row.day_date) {
        await upsertPolarExercise(row);
      }
    }
    if (list.length) console.log(`[polar-backfill] Exercises upserted`);
  } catch (err) {
    console.error("[polar-backfill] Error fetching exercises:", err);
  }

  // ── 2. Daily activity — last 28 days ────────────────────────────────────
  // Array of activity objects with start_time, active_duration, steps, etc.
  // (NOT the deprecated transaction-based API)
  try {
    const activities = await polarGet("/v3/users/activities", accessToken);
    const list = Array.isArray(activities) ? activities : [];
    console.log(`[polar-backfill] ${list.length} activity days fetched`);
    for (const a of list) {
      const row = mapPolarActivitySummaryToRow(user_id, a);
      if (row.day_date) {
        await upsertPolarActivitySummary(row);
      }
    }
    if (list.length) console.log(`[polar-backfill] Activity days upserted`);
  } catch (err) {
    console.error("[polar-backfill] Error fetching activities:", err);
  }

  // ── 3. Sleep — all available nights ─────────────────────────────────────
  // Response: { nights: [ { date, sleep_start_time, light_sleep, ... }, ... ] }
  try {
    const data = await polarGet(`/v3/users/sleep`, accessToken);
    const nights: any[] = data?.nights ?? (Array.isArray(data) ? data : []);
    console.log(`[polar-backfill] ${nights.length} sleep nights fetched`);
    for (const night of nights) {
      if (!night.date) continue;
      const row = mapPolarSleepToRow(user_id, night);
      await upsertPolarSleep(row);
    }
    if (nights.length) console.log(`[polar-backfill] Sleep nights upserted`);
  } catch (err) {
    console.error("[polar-backfill] Error fetching sleep:", err);
  }

  // ── 4. Nightly Recharge — all available records ──────────────────────────
  // Response: { recharges: [ { date, heart_rate_avg, heart_rate_variability_avg, ... } ] }
  try {
    const data = await polarGet(
      `/v3/users/nightly-recharge`,
      accessToken
    );
    const recharges: any[] = data?.recharges ?? (Array.isArray(data) ? data : []);
    console.log(`[polar-backfill] ${recharges.length} nightly recharge records fetched`);
    for (const r of recharges) {
      if (!r.date) continue;
      const row = mapPolarNightlyRechargeToRow(user_id, r);
      await upsertPolarNightlyRecharge(row);
    }
    if (recharges.length) console.log(`[polar-backfill] Nightly recharge upserted`);
  } catch (err) {
    console.error("[polar-backfill] Error fetching nightly recharge:", err);
  }

  console.log(`[polar-backfill] Complete for user_id=${user_id}`);
}
