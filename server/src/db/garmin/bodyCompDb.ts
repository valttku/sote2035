import { db } from "../db.js";

export type GarminBodyCompRow = {
  user_id: number;
  summary_id?: string | null;
  muscle_mass_in_grams?: number | null;
  bone_mass_in_grams?: number | null;
  body_water_in_percent?: number | null;
  body_fat_in_percent?: number | null;
  body_mass_index?: number | null;
  weight_in_grams?: number | null;
  measurement_time_in_seconds?: number | null;
  measurement_time_offset_in_seconds?: number | null;
  source?: string | null;
};

export function mapGarminBodyCompToRow(
  user_id: number,
  b: any,
): GarminBodyCompRow {
  return {
    user_id,
    summary_id: b.summaryId ?? null,
    muscle_mass_in_grams: b.muscleMassInGrams ?? null,
    bone_mass_in_grams: b.boneMassInGrams ?? null,
    body_water_in_percent: b.bodyWaterInPercent ?? null,
    body_fat_in_percent: b.bodyFatInPercent ?? null,
    body_mass_index: b.bodyMassIndex ?? null,
    weight_in_grams: b.weightInGrams ?? null,
    measurement_time_in_seconds: b.measurementTimeInSeconds ?? null,
    measurement_time_offset_in_seconds:
    b.measurementTimeOffsetInSeconds ?? null,
    source: b.source ?? "garmin",
  };
}

export async function upsertGarminBodyComp(row: GarminBodyCompRow) {
  if (!row) return;

  await db.query(
    `INSERT INTO app.user_body_comp_garmin
       (user_id, summary_id, muscle_mass_in_grams, bone_mass_in_grams, body_water_in_percent,
        body_fat_in_percent, body_mass_index, weight_in_grams, measurement_time_in_seconds, measurement_time_offset_in_seconds, source)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     ON CONFLICT (user_id)
     DO UPDATE SET
      summary_id = EXCLUDED.summary_id,
       muscle_mass_in_grams = EXCLUDED.muscle_mass_in_grams,
       bone_mass_in_grams = EXCLUDED.bone_mass_in_grams,
       body_water_in_percent = EXCLUDED.body_water_in_percent,
       body_fat_in_percent = EXCLUDED.body_fat_in_percent,
       body_mass_index = EXCLUDED.body_mass_index,
       weight_in_grams = EXCLUDED.weight_in_grams,
       measurement_time_in_seconds = EXCLUDED.measurement_time_in_seconds,
       measurement_time_offset_in_seconds = EXCLUDED.measurement_time_offset_in_seconds,
      source = EXCLUDED.source,
       updated_at = now()`,
    [
      row.user_id,
      row.summary_id,
      row.muscle_mass_in_grams,
      row.bone_mass_in_grams,
      row.body_water_in_percent,
      row.body_fat_in_percent,
      row.body_mass_index,
      row.weight_in_grams,
      row.measurement_time_in_seconds,
      row.measurement_time_offset_in_seconds,
      row.source,
    ],
  );
}
