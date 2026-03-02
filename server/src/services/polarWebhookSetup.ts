/**
 * polarWebhookSetup.ts
 *
 * Ensures a Polar AccessLink webhook is registered pointing at your server.
 * Polar allows ONE webhook per AccessLink client application.
 *
 * This uses CLIENT credentials (Basic auth with client_id:client_secret),
 * NOT a user Bearer token.
 *
 * Call ensurePolarWebhook() at server startup. Errors are logged but non-fatal
 * so the server still starts even if Polar is temporarily unreachable.
 *
 * Required env vars:
 *   POLAR_CLIENT_ID
 *   POLAR_CLIENT_SECRET
 *   POLAR_WEBHOOK_SERVER_URL  → your deployed server root URL
 *                               e.g. https://sote2035-server.onrender.com
 */

const BASE = "https://www.polaraccesslink.com";
const DESIRED_EVENTS = ["EXERCISE", "ACTIVITY_SUMMARY", "SLEEP"];

function getBasicAuth(): string {
  const id = process.env.POLAR_CLIENT_ID ?? "";
  const secret = process.env.POLAR_CLIENT_SECRET ?? "";
  if (!id || !secret) throw new Error("POLAR_CLIENT_ID / POLAR_CLIENT_SECRET not set");
  return Buffer.from(`${id}:${secret}`).toString("base64");
}

function getWebhookUrl(): string {
  const serverUrl =
    process.env.POLAR_WEBHOOK_SERVER_URL ??
    process.env.APP_SERVER_URL ??
    "";
  if (!serverUrl) {
    throw new Error(
      "Set POLAR_WEBHOOK_SERVER_URL env var to your server URL " +
        "(e.g. https://sote2035-server.onrender.com)"
    );
  }
  return `${serverUrl.replace(/\/$/, "")}/api/v1/webhooks/polar`;
}

async function adminFetch(
  method: string,
  path: string,
  body?: object
): Promise<{ status: number; data: any }> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Basic ${getBasicAuth()}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text().catch(() => "");
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: res.status, data };
}

export async function ensurePolarWebhook(): Promise<void> {
  try {
    const webhookUrl = getWebhookUrl();
    console.log(`[polar-webhook-setup] Checking webhook → ${webhookUrl}`);

    // GET /v3/webhooks — check if one already exists
    const { status: getStatus, data: existing } = await adminFetch("GET", "/v3/webhooks");

    if (getStatus === 200 && existing?.id) {
      const eventsOk = DESIRED_EVENTS.every((e) =>
        (existing.events ?? []).includes(e)
      );
      const urlOk = existing.url === webhookUrl;

      if (eventsOk && urlOk) {
        console.log(
          `[polar-webhook-setup] Webhook already correct (id=${existing.id}). Done.`
        );
        return;
      }

      // Patch URL and/or events
      console.log(
        `[polar-webhook-setup] Patching webhook id=${existing.id} ` +
          `(url match: ${urlOk}, events match: ${eventsOk})`
      );
      const { status: patchStatus, data: patchData } = await adminFetch(
        "PATCH",
        `/v3/webhooks/${existing.id}`,
        { events: DESIRED_EVENTS, url: webhookUrl }
      );
      if (patchStatus === 200) {
        console.log("[polar-webhook-setup] Webhook patched successfully");
      } else {
        console.error(`[polar-webhook-setup] PATCH failed ${patchStatus}:`, patchData);
      }
      return;
    }

    // No existing webhook — create one
    console.log("[polar-webhook-setup] Creating new webhook...");
    const { status: postStatus, data: created } = await adminFetch(
      "POST",
      "/v3/webhooks",
      { events: DESIRED_EVENTS, url: webhookUrl }
    );

    if (postStatus === 201 || postStatus === 200) {
      const secretKey = created?.data?.signature_secret_key ?? "n/a";
      console.log(
        `[polar-webhook-setup] Webhook created (id=${created?.id}). ` +
          `signature_secret_key=${secretKey} — save this if you want to verify signatures!`
      );
    } else {
      console.error(`[polar-webhook-setup] POST failed ${postStatus}:`, created);
    }
  } catch (err) {
    // Non-fatal — log and continue
    console.error("[polar-webhook-setup] Failed (will retry on next startup):", err);
  }
}
