import { db } from "../db.js";

export type GarminActivityRow = {
  user_id: number;
  activity_id: number;
  summary_id?: string | null;
  activity_name?: string | null;
  activity_description?: string | null;
  is_parent?: boolean | null;
  parent_summary_id?: string | null;
  duration_in_seconds?: number | null;
  start_time_in_seconds?: number | null;
  start_time_offset_in_seconds?: number | null;
  activity_type?: string | null;
  average_heart_rate?: number | null;
  max_heart_rate?: number | null;
  average_run_cadence?: number | null;
  max_run_cadence?: number | null;
  average_bike_cadence?: number | null;
  max_bike_cadence?: number | null;
  average_swim_cadence?: number | null;
  average_push_cadence?: number | null;
  max_push_cadence?: number | null;
  average_speed?: number | null;
  max_speed?: number | null;
  average_pace?: number | null;
  max_pace?: number | null;
  active_kilocalories?: number | null;
  device_name?: string | null;
  distance_in_meters?: number | null;
  steps?: number | null;
  pushes?: number | null;
  total_elevation_gain?: number | null;
  total_elevation_loss?: number | null;
  starting_latitude?: number | null;
  starting_longitude?: number | null;
  number_of_active_lengths?: number | null;
  manual?: boolean | null;
  is_web_upload?: boolean | null;
};

export function mapGarminActivityToRow(user_id: number, a: any): GarminActivityRow {
  return {
    user_id,
    activity_id: a.activityId,
    summary_id: a.summaryId ?? null,
    activity_name: a.activityName ?? null,
    activity_description: a.activityDescription ?? null,
    is_parent: a.isParent ?? null,
    parent_summary_id: a.parentSummaryId ?? null,
    duration_in_seconds: a.durationInSeconds ?? null,
    start_time_in_seconds: a.startTimeInSeconds ?? null,
    start_time_offset_in_seconds: a.startTimeOffsetInSeconds ?? null,
    activity_type: a.activityType ?? null,
    average_heart_rate: a.averageHeartRateInBeatsPerMinute ?? null,
    max_heart_rate: a.maxHeartRateInBeatsPerMinute ?? null,
    average_run_cadence: a.averageRunCadenceInStepsPerMinute ?? null,
    max_run_cadence: a.maxRunCadenceInStepsPerMinute ?? null,
    average_bike_cadence: a.averageBikeCadenceInRoundsPerMinute ?? null,
    max_bike_cadence: a.maxBikeCadenceInRoundsPerMinute ?? null,
    average_swim_cadence: a.averageSwimCadenceInStrokesPerMinute ?? null,
    average_push_cadence: a.averagePushCadenceInPushesPerMinute ?? null,
    max_push_cadence: a.maxPushCadenceInPushesPerMinute ?? null,
    average_speed: a.averageSpeedInMetersPerSecond ?? null,
    max_speed: a.maxSpeedInMetersPerSecond ?? null,
    average_pace: a.averagePaceInMinutesPerKilometer ?? null,
    max_pace: a.maxPaceInMinutesPerKilometer ?? null,
    active_kilocalories: a.activeKilocalories ?? null,
    device_name: a.deviceName ?? null,
    distance_in_meters: a.distanceInMeters ?? null,
    steps: a.steps ?? null,
    pushes: a.pushes ?? null,
    total_elevation_gain: a.totalElevationGainInMeters ?? null,
    total_elevation_loss: a.totalElevationLossInMeters ?? null,
    starting_latitude: a.startingLatitudeInDegree ?? null,
    starting_longitude: a.startingLongitudeInDegree ?? null,
    number_of_active_lengths: a.numberOfActiveLengths ?? null,
    manual: a.manual ?? null,
    is_web_upload: a.isWebUpload ?? null,
  };
}

export async function upsertGarminActivity(row: GarminActivityRow) {
  if (!row) return;

  await db.query(
    `INSERT INTO app.user_activities_garmin
       (user_id, activity_id, summary_id, activity_name, activity_description, is_parent,
        parent_summary_id, duration_in_seconds, start_time_in_seconds, start_time_offset_in_seconds,
        activity_type, average_heart_rate, max_heart_rate, average_run_cadence, max_run_cadence,
        average_bike_cadence, max_bike_cadence, average_swim_cadence, average_push_cadence, max_push_cadence,
        average_speed, max_speed, average_pace, max_pace, active_kilocalories, device_name,
        distance_in_meters, steps, pushes, total_elevation_gain, total_elevation_loss,
        starting_latitude, starting_longitude, number_of_active_lengths, manual, is_web_upload)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
             $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36)
     ON CONFLICT (user_id, activity_id)
     DO UPDATE SET
       summary_id = EXCLUDED.summary_id,
       activity_name = EXCLUDED.activity_name,
       activity_description = EXCLUDED.activity_description,
       is_parent = EXCLUDED.is_parent,
       parent_summary_id = EXCLUDED.parent_summary_id,
       duration_in_seconds = EXCLUDED.duration_in_seconds,
       start_time_in_seconds = EXCLUDED.start_time_in_seconds,
       start_time_offset_in_seconds = EXCLUDED.start_time_offset_in_seconds,
       activity_type = EXCLUDED.activity_type,
       average_heart_rate = EXCLUDED.average_heart_rate,
       max_heart_rate = EXCLUDED.max_heart_rate,
       average_run_cadence = EXCLUDED.average_run_cadence,
       max_run_cadence = EXCLUDED.max_run_cadence,
       average_bike_cadence = EXCLUDED.average_bike_cadence,
       max_bike_cadence = EXCLUDED.max_bike_cadence,
       average_swim_cadence = EXCLUDED.average_swim_cadence,
       average_push_cadence = EXCLUDED.average_push_cadence,
       max_push_cadence = EXCLUDED.max_push_cadence,
       average_speed = EXCLUDED.average_speed,
       max_speed = EXCLUDED.max_speed,
       average_pace = EXCLUDED.average_pace,
       max_pace = EXCLUDED.max_pace,
       active_kilocalories = EXCLUDED.active_kilocalories,
       device_name = EXCLUDED.device_name,
       distance_in_meters = EXCLUDED.distance_in_meters,
       steps = EXCLUDED.steps,
       pushes = EXCLUDED.pushes,
       total_elevation_gain = EXCLUDED.total_elevation_gain,
       total_elevation_loss = EXCLUDED.total_elevation_loss,
       starting_latitude = EXCLUDED.starting_latitude,
       starting_longitude = EXCLUDED.starting_longitude,
       number_of_active_lengths = EXCLUDED.number_of_active_lengths,
       manual = EXCLUDED.manual,
       is_web_upload = EXCLUDED.is_web_upload,
       updated_at = now()`,
    [
      row.user_id,
      row.activity_id,
      row.summary_id,
      row.activity_name,
      row.activity_description,
      row.is_parent,
      row.parent_summary_id,
      row.duration_in_seconds,
      row.start_time_in_seconds,
      row.start_time_offset_in_seconds,
      row.activity_type,
      row.average_heart_rate,
      row.max_heart_rate,
      row.average_run_cadence,
      row.max_run_cadence,
      row.average_bike_cadence,
      row.max_bike_cadence,
      row.average_swim_cadence,
      row.average_push_cadence,
      row.max_push_cadence,
      row.average_speed,
      row.max_speed,
      row.average_pace,
      row.max_pace,
      row.active_kilocalories,
      row.device_name,
      row.distance_in_meters,
      row.steps,
      row.pushes,
      row.total_elevation_gain,
      row.total_elevation_loss,
      row.starting_latitude,
      row.starting_longitude,
      row.number_of_active_lengths,
      row.manual,
      row.is_web_upload,
    ],
  );
}
