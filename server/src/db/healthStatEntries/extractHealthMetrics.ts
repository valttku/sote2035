// Format health stats data into human-friendly metrics for display

export function extractHealthMetrics(kind: string, data: any) {
  const metrics: Record<string, number> = {};

  if (!data || typeof data !== "object") return metrics;

  switch (kind) {
    case "heart_daily":
      if (data.hr_avg != null) metrics["Average heart rate"] = data.hr_avg;
      if (data.rhr != null) metrics["Resting heart rate"] = data.rhr;
      if (data.overnight_avg_hrv != null)
        metrics["Overnight average HRV"] = data.overnight_avg_hrv;
      break;

    case "sleep_daily":
      if (data.duration_seconds != null)
        metrics["Total sleep"] = data.duration_seconds;
      break;

    case "activity_daily":
      if (data.steps != null) metrics["Steps"] = data.steps;
      if (data.floors_climbed != null)
        metrics["Floors climbed"] = data.floors_climbed;
      if (data.weekly_intensity_total_seconds != null)
        metrics["Intense exercise this week"] =
          data.weekly_intensity_total_seconds;
      if (data.intensity_duration_seconds != null)
        metrics["Intense exercise today"] = data.intensity_duration_seconds;
      if (data.distance_meters != null)
        metrics["Distance"] = data.distance_meters;
      if (data.total_kcal != null)
        metrics["Total energy expenditure"] = data.total_kcal;
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
