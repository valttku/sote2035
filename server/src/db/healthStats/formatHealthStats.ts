// Format health stats data into human-friendly metrics for display

export function formatHealthEntry(kind: string, data: any) {
  const metrics: Record<string, number> = {};

  if (!data || typeof data !== "object") return metrics;

  switch (kind) {
    case "heart_daily":
      if (data.hr_avg != null) metrics["Average heart rate"] = data.hr_avg;
      if (data.rhr != null) metrics["Resting heart rate"] = data.rhr;
      break;

    case "sleep_daily":
      if (data.duration_seconds != null) {
        metrics["Total sleep"] = +(
          data.duration_seconds / 60
        ).toFixed(0);
      }
      break;

    case "activity_daily":
      if (data.steps != null) metrics["Steps"] = data.steps;

      if (data.distance_meters != null)
        metrics["Distance"] = +(data.distance_meters / 1000).toFixed(3);

      if (data.total_kcal != null) metrics["Total kcal"] = data.total_kcal;

      if (data.floors_climbed != null)
        metrics["Floors climbed"] = data.floors_climbed;

      if (data.intensity_duration_seconds != null)
        metrics["Intensity duration today"] = +(
          data.intensity_duration_seconds / 60
        ).toFixed(0);

      if (data.weekly_intensity_total_seconds != null)
        metrics["Intensity duration this week"] = +(
          data.weekly_intensity_total_seconds / 60
        ).toFixed(0);

      break;

    case "resp_daily":
      if (data.resp_rate != null)
        metrics["Average respiratory rate"] = data.resp_rate;
      break;

    case "stress_daily":
      if (data.stress_avg != null) metrics["Average stress"] = data.stress_avg;
      break;

    default:
      break;
  }

  return metrics;
}
