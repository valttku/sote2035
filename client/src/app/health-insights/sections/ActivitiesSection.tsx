"use client";

import { useState } from "react";
import { useTranslation } from "@/i18n/LanguageProvider";

export type Activity = {
  id: string;
  activity_name: string;
  duration_in_seconds?: number | null;
  distance_in_meters?: number | null;
  active_kilocalories?: number | null;
  average_heart_rate?: number | null;
  steps?: number | null;
  average_pace?: number | null;
  max_heart_rate?: number | null;
  avg_run_cadence?: number | null;
  avg_bike_cadence?: number | null;
  average_swim_cadence?: number | null;
  average_push_cadence?: number | null;
  pushes?: number | null;
  total_elevation_gain?: number | null;
  total_elevation_loss?: number | null;
};

type ActivitiesSectionProps = {
  activities?: Activity[];
  onActivitiesSelected?: (activityIds: Set<string>) => void;
  selectedActivityIds?: Set<string>;
};

export function ActivitiesSection({
  activities,
  onActivitiesSelected,
  selectedActivityIds = new Set(),
}: ActivitiesSectionProps) {
  const { t } = useTranslation();


  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(
    new Set(),
  );

  const hasData = activities && activities.length > 0;

  const isEmptyActivity = (activity: Activity) =>
    !activity.duration_in_seconds &&
    !activity.distance_in_meters &&
    !activity.active_kilocalories &&
    !activity.average_heart_rate;

  const displayActivities: Activity[] =
    hasData && !activities!.every(isEmptyActivity)
      ? activities!
      : [
          {
            id: "empty-1",
            activity_name: "Activity",
            duration_in_seconds: 0,
            distance_in_meters: 0,
            active_kilocalories: 0,
            average_heart_rate: 0,
          },
          {
            id: "empty-2",
            activity_name: "Activity",
            duration_in_seconds: 0,
            distance_in_meters: 0,
            active_kilocalories: 0,
            average_heart_rate: 0,
          },
        ];

  const checkData = (
    value: number | null | undefined,
    formatter?: (v: number) => string,
  ) =>
    value !== null && value !== undefined && !isNaN(value)
      ? formatter
        ? formatter(value)
        : String(value)
      : t.healthInsights.noData;

  const formatMinutes = (seconds: number) =>
    `${(seconds / 60).toFixed(1)} min`;
  const formatDistance = (meters: number) =>
    `${(meters / 1000).toFixed(2)} km`;
  const formatCalories = (kcal: number) => `${kcal} kcal`;
  const formatHeartRate = (hr: number) => `${hr} bpm`;

  const handleActivityToggle = (activityId: string) => {
    const newSelected = new Set(selectedActivityIds);
    if (newSelected.has(activityId)) {
      newSelected.delete(activityId);
    } else {
      newSelected.add(activityId);
    }
    onActivitiesSelected?.(newSelected);
  };

  const toggleExpand = (id: string) => {
    setExpandedActivities((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  // Mapping keys to label + formatter for display
  const activityFieldMap: Record<
    keyof Activity,
    { label: string; formatter?: (v: number) => string }
  > = {
    duration_in_seconds: {
      label: `⏱️ ${t.healthInsights.activities.fields.duration}`,
      formatter: formatMinutes,
    },
    distance_in_meters: {
      label: `🛤️ ${t.healthInsights.activities.fields.distance}`,
      formatter: formatDistance,
    },
    active_kilocalories: {
      label: `🔥 ${t.healthInsights.activities.fields.calories}`,
      formatter: formatCalories,
    },
    average_heart_rate: {
      label: `❤️ ${t.healthInsights.activities.fields.avgHeartRate}`,
      formatter: formatHeartRate,
    },
    max_heart_rate: {
      label: `💓 ${t.healthInsights.activities.fields.maxHeartRate}`,
      formatter: formatHeartRate,
    },
    steps: {
      label: `👣 ${t.healthInsights.activities.fields.steps}`,
    },
    average_pace: {
      label: `🏃 ${t.healthInsights.activities.fields.avgPace}`,
      formatter: (v) => `${v.toFixed(2)} min/km`,
    },
    avg_run_cadence: {
      label: `🏃 ${t.healthInsights.activities.fields.runCadence}`,
      formatter: (v) => `${v} spm`,
    },
    avg_bike_cadence: {
      label: `🚴 ${t.healthInsights.activities.fields.bikeCadence}`,
      formatter: (v) => `${v} rpm`,
    },
    average_swim_cadence: {
      label: `🏊 ${t.healthInsights.activities.fields.swimCadence}`,
      formatter: (v) => `${v} spm`,
    },
    average_push_cadence: {
      label: `🤸 ${t.healthInsights.activities.fields.pushCadence}`,
      formatter: (v) => `${v} spm`,
    },
    pushes: {
      label: `🤸 ${t.healthInsights.activities.fields.pushes}`,
    },
    total_elevation_gain: {
      label: `⬆️ ${t.healthInsights.activities.fields.elevationGain}`,
      formatter: (v) => `${v} m`,
    },
    total_elevation_loss: {
      label: `⬇️ ${t.healthInsights.activities.fields.elevationLoss}`,
      formatter: (v) => `${v} m`,
    },
    activity_name: {  label: t.healthInsights.activities.activityName,},
    id: { label: "ID" },
  };

  return (
  <div>
    <div
      className={`flex flex-col p-0 md:p-4 w-full h-full space-y-4 ${
        !hasData ? "opacity-50" : ""
      }`}
    >
      <p className="pb-2">
        {t.healthInsights.activities.count}:{" "}
        {hasData ? activities!.length : 0}
      </p>

      {displayActivities.map((activity) => (
        <div
          key={activity.id}
          className="bg-white/10 rounded-xl p-4 shadow-lg border border-white/20 text-white cursor-pointer"
          onClick={() => toggleExpand(activity.id)}
        >
          {/* TITLE ROW */}
          <div className="flex justify-between items-center">
            <div className="text-lg flex items-baseline gap-2">
              {activity.activity_name}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(activity.id);
                }}
                className="text-sm text-gray-400 hover:text-white cursor-pointer"
              >
                {expandedActivities.has(activity.id)
                  ? t.healthInsights.activities.hideDetails
                  : t.healthInsights.activities.openDetails}
              </div>
            </div>

            {/* Checkbox */}
            {hasData && (
              <input
                type="checkbox"
                checked={selectedActivityIds.has(activity.id)}
                onChange={(e) => {
                  e.stopPropagation();
                  handleActivityToggle(activity.id);
                }}
                className="cursor-pointer accent-[#1d9dad] w-5 h-5"
              />
            )}
          </div>

          {/* DETAILS SECTION */}
          {expandedActivities.has(activity.id) && (
            <div className="mt-2 text-sm text-gray-200 flex flex-wrap gap-4">
              {Object.entries(activityFieldMap).map(
                ([key, { label, formatter }]) => {
                  const value = activity[key as keyof Activity];

                  if (
                    value == null ||
                    key === "activity_name" ||
                    key === "id"
                  )
                    return null;

                  return (
                    <div key={key}>
                      {label}: {checkData(value as number, formatter)}
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
)}