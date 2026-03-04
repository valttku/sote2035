import express from "express";
import { db } from "../../db/db.js";
import {
  mapPolarExerciseToRow,
  upsertPolarExercise,
} from "../../db/polarTables/exercisesDb.js";
import {
  mapPolarActivitySummaryToRow,
  upsertPolarActivitySummary,
} from "../../db/polarTables/activitySummaryDb.js";
import {
  mapPolarSleepToRow,
  upsertPolarSleep,
} from "../../db/polarTables/sleepDb.js";
import {
  mapPolarNightlyRechargeToRow,
  upsertPolarNightlyRecharge,
} from "../../db/polarTables/nightlyRechargeDb.js";

export const polarWebhookRouter = express.Router();

/**
 * Look up a Polar user's access token by provider_user_id.
 * Polar's webhook payload contains `user_id` which maps to our `provider_user_id`.
 */
async function getPolarUserIntegration(
  polarUserId: number | string
): Promise<{ user_id: number; access_token: string } | null> {
  const r = await db.query(
    `SELECT user_id, access_token
     FROM app.user_integrations
     WHERE provider = 'polar' AND provider_user_id = $1`,
    [String(polarUserId)]
  );
  if (r.rowCount === 0) return null;
  return r.rows[0] as { user_id: number; access_token: string };
}

/**
 * Fetch JSON from a Polar AccessLink URL using the user's OAuth access token.
 */
async function fetchPolarResource(
  url: string,
  accessToken: string
): Promise<any | null> {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(
      `[polar-webhook] Failed to fetch ${url}: ${res.status} ${body}`
    );
    return null;
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// POST /api/v1/webhooks/polar
//
// Single endpoint for all Polar webhook events. Polar sends all events here
// with a "Polar-Webhook-Event" header and a "Polar-Webhook-Signature" for
// verification. The payload always has the shape:
//   { event, user_id, entity_id, timestamp, url }
//
// We then fetch the actual data from `url` using the user's access token.
// ---------------------------------------------------------------------------
polarWebhookRouter.post("/", async (req, res) => {
    const payload = req.body;
    const event: string = payload?.event ?? "";
    const polarUserId: number | string = payload?.user_id;
    const entityId: string = payload?.entity_id ?? "";
    const dataUrl: string = payload?.url ?? "";

    console.log(
      `[polar-webhook] Received event=${event} user_id=${polarUserId} entity_id=${entityId}`
    );

    // Handle PING — Polar sends this when creating a webhook to validate the URL
    if (event === "PING") {
      console.log("[polar-webhook] Received PING — responding 200");
      return res.sendStatus(200);
    }

    // Respond 200 immediately so Polar does not retry,
    // then process the data asynchronously to avoid timeout
    res.sendStatus(200);

    setImmediate(async () => {
      try {
        if (!polarUserId) {
          console.warn("[polar-webhook] No user_id in payload, skipping");
          return;
        }

        // Look up our internal user
        const integration = await getPolarUserIntegration(polarUserId);
        if (!integration) {
          console.warn(
            `[polar-webhook] No integration found for polar user_id=${polarUserId}`
          );
          return;
        }

        const { user_id, access_token } = integration;

        switch (event) {
          // ------------------------------------------------------------------
          // EXERCISE — a new workout has been synced to Polar Flow
          // Payload URL: /v3/exercises/{entity_id}
          // ------------------------------------------------------------------
          case "EXERCISE": {
            if (!dataUrl) {
              console.warn("[polar-webhook] EXERCISE event missing url");
              return;
            }

            const exerciseData = await fetchPolarResource(dataUrl, access_token);
            if (!exerciseData) return;

            console.log(
              `[polar-webhook] Processing exercise ${entityId} for user ${user_id}`
            );
            const row = mapPolarExerciseToRow(user_id, exerciseData);
            if (!row.day_date) {
              console.warn(
                "[polar-webhook] Exercise has no start_time, cannot determine day_date"
              );
              return;
            }
            await upsertPolarExercise(row);
            console.log(
              `[polar-webhook] Upserted exercise ${entityId} for user ${user_id} on ${row.day_date}`
            );
            break;
          }

          // ------------------------------------------------------------------
          // ACTIVITY_SUMMARY — daily activity summary is available
          // Payload URL: /v3/users/activities?date=YYYY-MM-DD
          // or direct URL to the specific day's activity
          // ------------------------------------------------------------------
          case "ACTIVITY_SUMMARY": {
            if (!dataUrl) {
              console.warn("[polar-webhook] ACTIVITY_SUMMARY event missing url");
              return;
            }

            const activityData = await fetchPolarResource(dataUrl, access_token);
            if (!activityData) return;

            const activities = Array.isArray(activityData)
              ? activityData
              : [activityData];

            for (const activity of activities) {
              // new API uses start_time; old deprecated API uses date
              const dayDate =
                activity.date ??
                (activity.start_time ? String(activity.start_time).slice(0, 10) : null);
              if (!dayDate) {
                console.warn("[polar-webhook] Activity missing date/start_time, skipping");
                continue;
              }
              console.log(
                `[polar-webhook] Processing activity_summary for user ${user_id} on ${dayDate}`
              );
              const row = mapPolarActivitySummaryToRow(user_id, activity);
              await upsertPolarActivitySummary(row);
              console.log(
                `[polar-webhook] Upserted activity_summary for user ${user_id} on ${dayDate}`
              );
            }
            break;
          }

          // ------------------------------------------------------------------
          // SLEEP — sleep data is available for a night
          // Payload URL: /v3/users/{user-id}/sleep/{date}
          //   or /v3/users/{user-id}/sleep
          // ------------------------------------------------------------------
          case "SLEEP": {
            if (!dataUrl) {
              console.warn("[polar-webhook] SLEEP event missing url");
              return;
            }

            const sleepData = await fetchPolarResource(dataUrl, access_token);
            if (!sleepData) return;

            // Response may be a single sleep object or contain a "nights" array
            const nights = sleepData.nights
              ? sleepData.nights
              : Array.isArray(sleepData)
              ? sleepData
              : [sleepData];

            for (const night of nights) {
              if (!night.date) {
                console.warn("[polar-webhook] Sleep record missing date, skipping");
                continue;
              }
              console.log(
                `[polar-webhook] Processing sleep for user ${user_id} on ${night.date}`
              );
              const row = mapPolarSleepToRow(user_id, night);
              await upsertPolarSleep(row);
              console.log(
                `[polar-webhook] Upserted sleep for user ${user_id} on ${night.date}`
              );
            }
            break;
          }

          // ------------------------------------------------------------------
          // NIGHTLY_RECHARGE — nightly recharge data is available
          // Payload URL: /v3/users/{user-id}/nightly-recharge/{date}
          // ------------------------------------------------------------------
          case "NIGHTLY_RECHARGE": {
            if (!dataUrl) {
              console.warn("[polar-webhook] NIGHTLY_RECHARGE event missing url");
              return;
            }

            const rechargeData = await fetchPolarResource(dataUrl, access_token);
            if (!rechargeData) return;

            // Response may be a single object or a list
            const recharges = rechargeData.recharges
              ? rechargeData.recharges
              : Array.isArray(rechargeData)
              ? rechargeData
              : [rechargeData];

            for (const recharge of recharges) {
              if (!recharge.date) {
                console.warn(
                  "[polar-webhook] Nightly recharge record missing date, skipping"
                );
                continue;
              }
              console.log(
                `[polar-webhook] Processing nightly_recharge for user ${user_id} on ${recharge.date}`
              );
              const row = mapPolarNightlyRechargeToRow(user_id, recharge);
              await upsertPolarNightlyRecharge(row);
              console.log(
                `[polar-webhook] Upserted nightly_recharge for user ${user_id} on ${recharge.date}`
              );
            }
            break;
          }

          // ------------------------------------------------------------------
          // CONTINUOUS_HEART_RATE, SLEEP_WISE_*, etc. — not yet handled
          // ------------------------------------------------------------------
          default:
            console.log(
              `[polar-webhook] Unhandled event type: ${event} — ignoring`
            );
        }
      } catch (err) {
        console.error("[polar-webhook] Error processing event:", err);
      }
    });
  }
);

export default polarWebhookRouter;
