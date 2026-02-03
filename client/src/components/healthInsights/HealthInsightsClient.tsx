"use client";

import { mock } from "node:test";
import { useState } from "react";

export default function HealthInsightsClient() {
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const mockHealthData = {
    recoveryAndSleep: {
      sleepHours: 8,
      sleepQuality: "medium",
      recoveryScore: 85,
    },
    cardiovascularHealth: {
      restingHeartRate: 42,
      heartRateVariability: 114,
    },
    activityAndMovement: {
      steps: 12000,
      workoutsThisWeek: 4,
    },
    stressAndReadiness: {
      stressLevel: "low",
      readinessScore: 20,
    },
  };

  const handleAnalyzeClick = async () => {
    setLoading(true);
    setResult(null);
    setShowResult(false);

    try {
      const response = await fetch(`/api/v1/openai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Analyze my health data:\n${JSON.stringify(
            mockHealthData,
            null,
            2,
          )}`,
        }),
      });

      const data = await response.json();
      setResult(data.result);
      setShowResult(true);
    } catch (err) {
      console.error(err);
      setResult("Failed to get AI insights. Try again.");
      setShowResult(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden m-10">
      <h1 className="text-3xl">Health Insights</h1>
      <div className="ui-component-styles rounded-2xl flex flex-col gap-6 p-6 mt-6 w-full max-w-2xl">
        <p>
          Here you will find insights about your health data. Click the button
          below to analyze the mock health data.
        </p>

        <p> {JSON.stringify(mockHealthData, null, 2)}</p>

        <button
          className="button-style-blue"
          onClick={handleAnalyzeClick}
          disabled={loading}
        >
          {loading ? "Analyzing..." : "Analyze my data"}
        </button>

        {showResult && (
          <div className="mt-6 p-4 bg-gray-100 rounded-xl w-full">
            <h3 className="text-lg font-semibold mb-2 text-black">
              AI Insights:
            </h3>
            <p className="text-black">{result}</p>
          </div>
        )}
      </div>
    </div>
  );
}
