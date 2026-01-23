import { db } from "./db.js";

// This file contains DB queries related to activities table in the database

type ActivityRow = {
  user_id: number;
  day_date: string;
  source: string;
  start_time: Date;
  end_time: Date;
  duration_seconds: number;
  distance_meters: number;
  calories: number;
  steps: number;
  heart_rate_zones: Record<string, any>;
  inactive_seconds: number;
};

// inserts or updates user activity data in the activities table
export async function upsertUserActivities(rows: ActivityRow[]) {
    
}