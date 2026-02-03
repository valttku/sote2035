export type HealthStatsEntry = {
  id: string;
  kind: string;
  source: string | null;
  data: unknown;
  created_at: string;
};

export type HealthStatsResponse = {
  date: string;
  entries: HealthStatsEntry[];
};

export type ActivitiesEntry = {
  id: string;
  device_name?: string | null;
  activity_name: string;
  duration_in_seconds?: number | null;
  start_time_in_seconds?: number | null;
  start_time_offset_in_seconds?: number | null;
  average_heart_rate?: number | null;
  active_kilocalories?: number | null;
  steps?: number | null;
  created_at: string;
  source_type?: "garmin" | "manual" | "polar";
};

export type ActivitiesResponse = {
  date: string;
  entries: ActivitiesEntry[];
};
