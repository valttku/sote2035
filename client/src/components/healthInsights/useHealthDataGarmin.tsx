import { useState, useEffect } from "react";

// Custom hook to fetch garmin health data for a given date
export function useHealthData(date?: string) {
  const [healthData, setHealthData] = useState<any>(null);
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
        }

        const data = await response.json();
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
