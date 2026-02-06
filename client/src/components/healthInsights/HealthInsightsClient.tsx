"use client";
import { useState } from "react";
import { ActivitiesSection, Activity } from "./ActivitiesSection";
import { DailiesSection, Dailies } from "./DailiesSection";
import { useHealthData } from "./useHealthDataGarmin";

type Section =
  | "dailies"
  | "activities"
  | "sleep"
  | "stress"
  | "cardiovascular"
  | "bodyComposition";

type HealthDataToAnalyze = {
  activities?: Activity[];
  dailies?: Dailies;
  profile?: {
    height: number;
    weight: number;
    gender: string;
  };
};

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
      const dataToAnalyze: HealthDataToAnalyze = {};

      // Include profile
      if (healthData?.profile) {
        dataToAnalyze.profile = {
          height: healthData.profile.height,
          weight: healthData.profile.weight,
          gender: healthData.profile.gender,
        };
      }

      if (activeSection === "activities") {
        if (selectedActivityIds.size > 0 && healthData?.activities) {
          dataToAnalyze.activities = healthData.activities.filter((activity) =>
            selectedActivityIds.has(activity.id),
          );
        } else {
          dataToAnalyze.activities = healthData?.activities;
        }
      }

      if (activeSection === "dailies") {
        dataToAnalyze.dailies = healthData?.dailies?.[0];
      }

      console.log("Data sent to AI:", dataToAnalyze);

      const isToday = selectedDate === new Date().toISOString().split("T")[0];

      const response = await fetch(`/api/v1/openai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Analyze my ${activeSection} data for ${selectedDate}:\n${JSON.stringify(
            dataToAnalyze,
            null,
            2,
          )}\nProvide insights and suggestions based on the data. 
          ${isToday ? "Speak to me in present tense." : "Speak to me in past tense."}
          If the day is not finished yet, provide insights based on the 
          available data and mention that the analysis is preliminary.
          Don&apos;t list things. Don&apos;t greet. Max 10 sentences.`,
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
      <div className="ui-component-styles p-6 w-full max-w-6xl h-[80vh] flex flex-col overflow-hidden">
        <h1 className="text-4xl m-2">Health Insights</h1>

        {/* Navigation */}
        <div className="flex flex-col md:flex-row mb-5 border-b gap-2 md:gap-0 items-start md:items-center pb-3 pt-3">
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
                    ? "bg-[#31c2d5] text-white"
                    : "bg-[#1e1c4f]/40 text-gray-300 hover:bg-[#2a2a60]/80 hover:text-white"
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
              className="block w-full rounded-md 
              border-gray-300 shadow-sm 
              focus:border-blue-500 
              focus:ring-blue-500 
              sm:text-sm p-2 border"
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
                    <DailiesSection dailies={healthData?.dailies?.[0]} />
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
              <div className="bg-[#1e1c4f]/20 border-2 border-[#31c2d5] rounded-lg flex flex-col h-full">
                <p className="sticky top-0 z-10 text-lg p-1 pl-5 bg-[#31c2d5]">
                  AI Analysis
                </p>
                <div className="flex-1 overflow-y-auto p-5">
                  {showResult && result ? (
                    <p className="whitespace-pre-wrap text-sm">{result}</p>
                  ) : (
                    <p className="italic text-sm">
                      Select data and click "Analyze" to get insights and
                      suggestions from the AI.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Analyze Button */}
          <button
            className="button-style-blue w-full md:w-[200px] justify-center mt-3"
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
                  ? `Analyze ${activeSection}`
                  : "Analyze all data"}
          </button>
        </div>
      </div>
    </div>
  );
}
