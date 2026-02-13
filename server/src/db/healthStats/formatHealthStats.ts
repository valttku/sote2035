// Format health stats data into human-friendly metrics for display

// Convert seconds into hours and minutes (e.g. 1h 30m)"
function formatSecondsHM(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0m";
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// Format raw health stat entry into display metrics
export function formatHealthEntry(kind: string, data: any) {
  const metrics: Record<string, string | number> = {};

  if (!data || typeof data !== "object") return metrics;

  switch (kind) {
    case "heart_daily":
      if (data.hr_avg != null) metrics["Average heart rate"] = data.hr_avg;
      if (data.rhr != null) metrics["Resting heart rate"] = data.rhr;
      break;

    case "sleep_daily":
      if (data.duration_seconds != null) {
        metrics["Total sleep (h)"] = +(data.duration_seconds / 3600).toFixed(1);
        metrics["Total sleep (h:m)"] = formatSecondsHM(data.duration_seconds);
      }
      break;

    case "activity_daily":
      if (data.steps != null) {
        if (data.steps_goal != null) {
          metrics["Steps"] = `${data.steps} / ${data.steps_goal}`;
        } else {
          metrics["Steps"] = data.steps;
        }
      }

      if (data.distance_meters != null)
        metrics["Distance (km)"] = +(data.distance_meters / 1000).toFixed(2);

      if (data.active_kcal != null) metrics["Active kcal"] = data.active_kcal;
      if (data.total_kcal != null) metrics["Total kcal"] = data.total_kcal;

      if (data.floors_climbed != null) {
        if (data.floors_climbed_goal != null) {
          metrics["Floors climbed"] =
            `${data.floors_climbed} / ${data.floors_climbed_goal}`;
        } else {
          metrics["Floors climbed"] = data.floors_climbed;
        }
      }

      if (data.intensity_duration_seconds != null) {
        metrics["Intensity minutes today"] = +(
          data.intensity_duration_seconds / 60
        ).toFixed(1);
        metrics["Intensity today (h:m)"] = formatSecondsHM(
          data.intensity_duration_seconds,
        );
      }

      if (data.intensity_duration_goal_in_seconds != null) {
        metrics["Intensity minutes goal"] = +(
          data.intensity_duration_goal_in_seconds / 60
        ).toFixed(1);
        metrics["Intensity goal (h:m)"] = formatSecondsHM(
          data.intensity_duration_goal_in_seconds,
        );
      }

      if (data.weekly_intensity_total_seconds != null) {
        metrics["Weekly intensity minutes"] = +(
          data.weekly_intensity_total_seconds / 60
        ).toFixed(1);
        metrics["Weekly intensity (h:m)"] = formatSecondsHM(
          data.weekly_intensity_total_seconds,
        );
      }
      break;

    case "resp_daily":
      if (data.resp_rate != null)
        metrics["Average respiratory rate (awake)"] = data.resp_rate;
      break;

    case "stress_daily":
      if (data.stress_avg != null) metrics["Average stress"] = data.stress_avg;
      if (data.stress_qualifier != null)
        metrics["Stress qualifier"] = data.stress_qualifier;
      break;

    default:
      break;
  }

  return metrics;
}
