import { useState, useEffect } from "react";
import { Activity } from "../sections/ActivitiesSection";
import { Dailies } from "../sections/DailiesSection";

export type UserProfile = {
  id: number;
  height: number;
  weight: number;
  gender: string;
};

export type HealthData = {
  activities?: Activity[];
  dailies?: Dailies[];
  sleep?: unknown;
  stress?: unknown;
  heartRate?: unknown;
  bodyComposition?: unknown;
  profile?: UserProfile;
};

export function useHealthData(date?: string) {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const dateParam = date || new Date().toISOString().split("T")[0];

        const response = await fetch(
          `/api/v1/health-insights/garmin?date=${dateParam}`,
          {
            credentials: "include",
          },
        );

        if (!response.ok) {
          setError(`${response.status} ${response.statusText}`);
          setHealthData(null);
          return;
        }

        const data: HealthData = await response.json();
        setHealthData(data);
      } catch (err) {
        console.error("Failed to load health data:", err);
        setError(String(err));
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [date]);

  return { healthData, loading, error };
}
