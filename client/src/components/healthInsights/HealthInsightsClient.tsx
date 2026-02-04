"use client";
import { useState, useEffect } from "react";
import { ActivitiesSection } from "./ActivitiesSection";
import { useHealthData } from "./useHealthDataGarmin";
import type { Activity } from "./ActivitiesSection";

type Section = "activities" | "sleep" | "stress" | "cardiovascular" | "dailies";

export default function HealthInsightsClient() {
  const [activeSection, setActiveSection] = useState<Section>("activities");
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const { healthData, loading: loadingData } = useHealthData(selectedDate);

  const handleAnalyzeClick = async () => {
    setLoading(true);
    setResult(null);
    setShowResult(false);

    try {
      const response = await fetch(`/api/v1/openai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Analyze my health data for ${selectedDate}:\n${JSON.stringify(
            healthData,
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
    { id: "activities", label: "Activities" },
    { id: "sleep", label: "Sleep" },
    { id: "stress", label: "Stress" },
    { id: "cardiovascular", label: "Heart Health" },
    { id: "dailies", label: "Dailies" },
  ];

  return (
    <div className="h-full w-full overflow-x-hidden p-20">
      <div className="ui-component-styles rounded-2xl w-[70%] h-[80vh] overflow-hidden p-10 flex flex-col">
        <h1 className="text-4xl">Health Insights</h1>

        <div className="flex-1">
          {/* Navigation */}
          <div className="flex gap-2 mb-6 overflow-x-auto py-5 border-b">
            {sections.map((section, index) => (
              <button
                key={section.id}
                onClick={() =>
                  !section.disabled && setActiveSection(section.id)
                }
                disabled={section.disabled}
                className={`px-4 text-lg font-medium transition-colors border-x-0 border-r border-white/20
              ${index === sections.length - 1 ? "border-r-0" : ""}
              ${
                activeSection === section.id
                  ? "text-[#1aa5b0]"
                  : section.disabled
                    ? "text-gray-400 cursor-not-allowed"
                    : "hover:text-[#1aa5b0]"
              }`}
              >
                {section.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex flex-row items-start">
            {loadingData ? (
              <p className="">Loading health data...</p>
            ) : (
              <>
                {activeSection === "activities" && (
                  <ActivitiesSection activities={healthData?.activities as Activity[] | undefined} />
                )}
                {activeSection === "sleep" && (
                  <div className="p-4">Sleep section coming soon...</div>
                )}
                {activeSection === "stress" && (
                  <div className="p-4">Stress section coming soon...</div>
                )}
                {activeSection === "cardiovascular" && (
                  <div className="p-4">
                    Cardiovascular section coming soon...
                  </div>
                )}
                {activeSection === "dailies" && (
                  <div className="p-4">Dailies section coming soon...</div>
                )}
              </>
            )}

            {/*Date Selection */}
            <div className="ml-auto">
              <label htmlFor="date" className="block text-sm font-medium">
                Select Date:
              </label>
              <input
                type="date"
                id="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              />
            </div>
          </div>

          {/* Analyze Button */}
          <button
            className="button-style-blue mt-6"
            onClick={handleAnalyzeClick}
            disabled={loading || loadingData}
          >
            {loading ? "Analyzing..." : "Analyze my data"}
          </button>
        </div>

        {showResult && (
          <div className="mt-6 p-4 bg-white/70 rounded-xl max-h-[20vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-black">AI Insights:</h3>
              <button
                onClick={() => setShowResult(false)}
                className="text-gray-600 hover:text-gray-900 text-xl"
              >
                ✕
              </button>
            </div>
            <p className="text-black whitespace-pre-wrap">{result}</p>
          </div>
        )}
      </div>
    </div>
  );
}
