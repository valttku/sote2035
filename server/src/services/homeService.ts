import { getAICompletion } from "../services/openAIService.js";

type CachedAI = {
  message: string;
  createdAt: number;
};

type AIResult = {
  message: string | null;
  status: "generated" | "quota_exceeded" | "error";
};

export type AlertDetail = {
  part: string;
  metric: string;
  status: "low" | "high";
  value: any;
};

const aiCache = new Map<string, CachedAI>();
const aiInFlight = new Map<string, Promise<AIResult>>();

const AI_CACHE_TTL = 1000 * 60 * 60 * 6; // 6h

// Detect if error is likely due to quota/rate limit issues
function isQuotaOrRateLimitError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;

  const error = err as {
    status?: number;
    message?: string;
    code?: string;
    error?: { message?: string; type?: string; code?: string };
  };

  const msg = [
    error.message,
    error.error?.message,
    error.error?.type,
    error.code,
    error.error?.code,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    error.status === 429 ||
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("too many requests")
  );
}

export function buildAlertSignature(alerts: AlertDetail[]) {
  if (!alerts.length) return "no-alerts";

  return alerts
    .map((a) => `${a.part}:${a.metric}:${a.status}`)
    .sort()
    .join("|");
}

function buildPrompt(alerts: AlertDetail[], date: string) {
  const lines = alerts
    .map((a) => `- ${a.part}: ${a.metric} is ${a.status} (${a.value})`)
    .join("\n");

  return `
You are a health assistant. Here are the user's health alerts for ${date}:

${lines}

Give concise, specific, actionable advice.
`;
}

export function detectAlerts(metricsByPart: any[], parts: string[]) {
  const alerts: Record<string, boolean> = {};
  const outOfRangeDetails: AlertDetail[] = [];

  for (let i = 0; i < parts.length; i++) {
    const metrics = metricsByPart[i] ?? {};
    alerts[parts[i]] = false;

    for (const [metric, value] of Object.entries(metrics)) {
      if (
        typeof value === "object" &&
        value &&
        "status" in value &&
        (value.status === "low" || value.status === "high")
      ) {
        alerts[parts[i]] = true;

        outOfRangeDetails.push({
          part: parts[i],
          metric,
          status: value.status,
          value: (value as any).value,
        });
      }
    }
  }

  return { alerts, outOfRangeDetails };
}

export async function getCachedAIAdvice(
  userId: string,
  date: string,
  alerts: AlertDetail[],
  aiRequested: boolean,
): Promise<{ message: string | null; status: string }> {

  if (!alerts.length || !aiRequested) {
    console.log("AI skipped: no alerts or AI not requested");
    return { message: null, status: "none" };
  }

  const alertSignature = buildAlertSignature(alerts);
  const cacheKey = `${userId}-${date}-${alertSignature}`;

  const cached = aiCache.get(cacheKey);

  if (cached && Date.now() - cached.createdAt < AI_CACHE_TTL) {
    console.log("AI cache hit → stored message reused", {
      userId,
      date,
      alertSignature,
    });

    return { message: cached.message, status: "generated" };
  }

  console.log("AI cache miss → generating new message", {
    userId,
    date,
    alertSignature,
  });

  let generation = aiInFlight.get(cacheKey);

  if (!generation) {
    console.log("AI message generation started", {
      userId,
      date,
      alertSignature,
      alertCount: alerts.length,
    });

    const prompt = buildPrompt(alerts, date);

    generation = getAICompletion(prompt)
      .then((content): AIResult => {
        console.log("AI generation success");

        return {
          message: content.trim(),
          status: "generated",
        };
      })
      .catch((err): AIResult => {
        console.error("AI generation failed", err);

        return {
          message: null,
          status: isQuotaOrRateLimitError(err)
            ? "quota_exceeded"
            : "error",
        };
      })
      .finally(() => {
        aiInFlight.delete(cacheKey);
      });

    aiInFlight.set(cacheKey, generation);
  }

  const result = await generation;

  if (result.status === "generated" && result.message) {
    console.log("AI message cached");

    aiCache.set(cacheKey, {
      message: result.message,
      createdAt: Date.now(),
    });
  }

  return result;
}
