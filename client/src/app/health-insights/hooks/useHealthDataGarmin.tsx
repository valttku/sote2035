import { useState, useEffect } from "react";
import { Activity } from "../sections/ActivitiesSection";
import { Dailies } from "../sections/DailiesSection";
import { UserProfile } from "../sections/UserProfileSection";
import { Sleep } from "../sections/SleepSection";
import { Stress } from "../sections/StressSection";
import { Respiration } from "../sections/RespirationSection";

export type HealthData = {
  profile?: UserProfile;
  dailies?: Dailies[];
  activities?: Activity[];
  sleep?: Sleep[];
  stress?: Stress[];
  respiration?: Respiration[];
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
        type RawHealthData = {
          profile?: UserProfile | UserProfile[];
          dailies?: Dailies | Dailies[];
          activities?: Activity | Activity[];
          sleep?: Sleep | Sleep[];
          stress?: Stress | Stress[];
          respiration?: Respiration | Respiration[];
        };

        const raw = (await response.json()) as RawHealthData;

        const normalized: HealthData = {
          profile: raw.profile
            ? Array.isArray(raw.profile)
              ? raw.profile[0]
              : raw.profile
            : undefined,
          dailies: raw.dailies
            ? Array.isArray(raw.dailies)
              ? raw.dailies
              : [raw.dailies]
            : [],
          activities: raw.activities
            ? Array.isArray(raw.activities)
              ? raw.activities
              : [raw.activities]
            : [],
          sleep: raw.sleep
            ? Array.isArray(raw.sleep)
              ? raw.sleep
              : [raw.sleep]
            : [],
          stress: raw.stress
            ? Array.isArray(raw.stress)
              ? raw.stress
              : [raw.stress]
            : [],
          respiration: raw.respiration
            ? Array.isArray(raw.respiration)
              ? raw.respiration
              : [raw.respiration]
            : [],
        };

        setHealthData(normalized);
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
