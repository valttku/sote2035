export function formatHealthEntry(kind: string, data: any) {
  const metrics: Record<string, string | number> = {};

  if (!data || typeof data !== "object") return metrics;

  if (kind === "heart_daily") {
    if (data.hr_avg != null) metrics["Average heart rate"] = data.hr_avg;
    if (data.rhr != null) metrics["Resting heart rate"] = data.rhr;
    if (data.hr_max != null) metrics["Max heart rate"] = data.hr_max;
    if (data.hr_min != null) metrics["Min heart rate"] = data.hr_min;
  }

  if (kind === "sleep_daily") {
    if (data.duration_seconds != null) {
      metrics["Total sleep (h)"] = +(data.duration_seconds / 3600).toFixed(1);
    }
    if (data.deep_seconds != null) {
      metrics["Deep sleep (h)"] = +(data.deep_seconds / 3600).toFixed(1);
    }
    if (data.light_seconds != null) {
      metrics["Light sleep (h)"] = +(data.light_seconds / 3600).toFixed(1);
    }
    if (data.rem_seconds != null) {
      metrics["REM sleep (h)"] = +(data.rem_seconds / 3600).toFixed(1);
    }
    if (data.awake_seconds != null) {
      metrics["Awake (h)"] = +(data.awake_seconds / 3600).toFixed(1);
    }
  }

  if (kind === "activity_daily") {
    if (data.steps != null) metrics["Steps"] = data.steps;
    if (data.distance_meters != null)
      metrics["Distance (km)"] = +(data.distance_meters / 1000).toFixed(2);
    if (data.active_kcal != null) metrics["Active kcal"] = data.active_kcal;
    if (data.total_kcal != null) metrics["Total kcal"] = data.total_kcal;
    if (data.floors_climbed != null)
      metrics["Floors climbed"] = data.floors_climbed;
    if (data.intensity_duration_seconds != null)
      metrics["Intensity duration (min)"] = +(
        data.intensity_duration_seconds / 60
      ).toFixed(1);
  }

  if (kind === "resp_daily" && data.resp_rate != null) {
    metrics["Average respiratory rate (awake)"] = data.resp_rate;
  }

  if (kind === "stress_daily") {
    if (data.stress_avg != null) metrics["Average stress"] = data.stress_avg;
    if (data.stress_max != null) metrics["Max stress"] = data.stress_max;
  }

  return metrics;
}
