"use client";
import { useState, useEffect } from "react";
import { ActivitiesSection } from "./ActivitiesSection";
import { useHealthData } from "./useHealthDataGarmin";
import type { Activity } from "./ActivitiesSection";

type Section =
  | "dailies"
  | "activities"
  | "sleep"
  | "stress"
  | "cardiovascular"
  | "bodyComposition";

export default function HealthInsightsClient() {
  const [activeSection, setActiveSection] = useState<Section>("activities");
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [selectedActivityIds, setSelectedActivityIds] = useState<Set<string>>(
    new Set(),
  );
  const { healthData, loading: loadingData } = useHealthData(selectedDate);

  const handleAnalyzeClick = async () => {
    setLoading(true);
    setResult(null);
    setShowResult(false);

    try {
      // If specific activities are selected, analyze only those; otherwise analyze all
      let dataToAnalyze: any;

      if (selectedActivityIds.size > 0 && healthData?.activities) {
        const filteredActivities = (healthData.activities as Activity[]).filter(
          (activity: Activity) => selectedActivityIds.has(activity.id),
        );
        dataToAnalyze = { activities: filteredActivities };
      } else {
        dataToAnalyze = healthData;
      }

      const response = await fetch(`/api/v1/openai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Analyze my health data for ${selectedDate}:\n${JSON.stringify(
            dataToAnalyze,
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

  const sections: { id: Section; label: string; disabled?: boolean }[] = [
    { id: "dailies", label: "Dailies" },
    { id: "activities", label: "Activities" },
    { id: "sleep", label: "Sleep" },
    { id: "stress", label: "Stress" },
    { id: "cardiovascular", label: "Heart Health" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="ui-component-styles p-6 w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden">
        <h1 className="text-4xl m-2">Health Insights</h1>

        {/* Navigation */}
        <div className="flex flex-col md:flex-row mb-5 border-b gap-2 md:gap-0 items-start md:items-center">
          <div className="flex flex-wrap gap-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() =>
                  !section.disabled && setActiveSection(section.id)
                }
                disabled={section.disabled}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  activeSection === section.id
                    ? "bg-[#1aa5b0] text-white"
                    : "bg-[#2a2a60] text-gray-300 hover:bg-[#1e1c4f]/60 hover:text-white"
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>

          {/* Date Selection */}
          <div className="ml-auto w-full max-w-[150px] md:max-w-[200px] mt-2 md:mt-0">
            <input
              type="date"
              id="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden p-2">
          {/* Row with activities + AI */}
          <div className="flex flex-col md:flex-row flex-1 min-h-0 gap-4 md:gap-6">
            {/* Activities */}
            <div className="flex-1 min-w-0 overflow-y-auto">
              {loadingData ? (
                <p>Loading health data...</p>
              ) : (
                <>
                  {activeSection === "dailies" && (
                    <div className="p-4">Dailies section coming soon...</div>
                  )}
                  {activeSection === "activities" && (
                    <ActivitiesSection
                      activities={
                        healthData?.activities as Activity[] | undefined
                      }
                      onActivitiesSelected={setSelectedActivityIds}
                      selectedActivityIds={selectedActivityIds}
                    />
                  )}
                  {activeSection === "sleep" && (
                    <div className="p-4">Sleep section coming soon...</div>
                  )}
                  {activeSection === "stress" && (
                    <div className="p-4">Stress section coming soon...</div>
                  )}
                  {activeSection === "cardiovascular" && (
                    <div className="p-4">Cardio section coming soon...</div>
                  )}
                </>
              )}
            </div>

            {/* AI Panel */}
            <div className="flex-[0_0_40%] min-w-[200px] flex flex-col overflow-hidden mt-4 md:mt-0">
              <div className="bg-[#171741]/20 border-2 border-[#1aa5b0] rounded-lg flex flex-col h-full">
                <p className="sticky top-0 z-10 text-lg p-1 pl-5 bg-[#1d9dad]">
                  AI Analysis
                </p>
                <div className="flex-1 overflow-y-auto p-5">
                  {showResult && result ? (
                    <p className="whitespace-pre-wrap text-sm">{result}</p>
                  ) : (
                    <p className="italic text-sm">
                      Select activities to analyze...
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Analyze Button */}
          <button
            className="button-style-blue w-full md:w-[200px] justify-center mt-auto"
            onClick={() => {
              if (showResult) setShowResult(false);
              else handleAnalyzeClick();
            }}
            disabled={loading || loadingData}
          >
            {loading
              ? "Analyzing..."
              : showResult
                ? "Clear Analysis"
                : selectedActivityIds.size > 0
                  ? `Analyze ${selectedActivityIds.size} activity(ies)`
                  : "Analyze all data"}
          </button>
        </div>
      </div>
    </div>
  );
}
