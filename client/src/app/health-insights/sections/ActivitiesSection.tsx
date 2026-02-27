"use client";

import { useState } from "react";

export type Activity = {
  id: string;
  activity_name: string;
  duration_in_seconds?: number | null; // all activities have
  distance_in_meters?: number | null; // some activities may not have
  active_kilocalories?: number | null; // all activities have
  average_heart_rate?: number | null; // all activities have
  steps?: number | null; // all activities have
  average_pace?: number | null; // some activities may not have
  max_heart_rate?: number | null; // all activities have
  avg_run_cadence?: number | null; // some activities may not have
  avg_bike_cadence?: number | null; // some activities may not have
  average_swim_cadence?: number | null; // some activities may not have,
  average_push_cadence?: number | null; // some activities may not have,
  pushes?: number | null; // some activities may not have
  total_elevation_gain?: number | null; // some activities may not have,
  total_elevation_loss?: number | null; // some activities may not have,
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
  const hasData = activities && activities.length > 0;

  // Check if the activity is fully empty (all numeric fields 0)
  const isEmptyActivity = (activity: Activity) =>
    !activity.duration_in_seconds &&
    !activity.distance_in_meters &&
    !activity.active_kilocalories &&
    !activity.average_heart_rate;

  // Use dummy activities if none exist
  const displayActivities: Activity[] =
    hasData && !activities.every(isEmptyActivity)
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

  // show "No data" if value is null/undefined/NaN
  const checkData = (
    value: number | null | undefined,
    formatter?: (v: number) => string,
  ) =>
    value !== null && value !== undefined && !isNaN(value)
      ? formatter
        ? formatter(value)
        : String(value)
      : "No data";

  const formatMinutes = (seconds: number) => `${(seconds / 60).toFixed(1)} min`;
  const formatDistance = (meters: number) => `${(meters / 1000).toFixed(2)} km`;
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

  // Mapping keys to label + optional formatter
  const activityFieldMap: Record<
    keyof Activity,
    { label: string; formatter?: (v: number) => string }
  > = {
    duration_in_seconds: { label: "⏱️Duration", formatter: formatMinutes },
    distance_in_meters: { label: "🛤️Distance", formatter: formatDistance },
    active_kilocalories: { label: "🔥Calories", formatter: formatCalories },
    average_heart_rate: { label: "❤️Avg HR", formatter: formatHeartRate },
    max_heart_rate: { label: "💓Max HR", formatter: formatHeartRate },
    steps: { label: "👣Steps" },
    average_pace: {
      label: "🏃‍♂️Avg Pace",
      formatter: (v) => `${v.toFixed(2)} min/km`,
    },
    avg_run_cadence: { label: "🏃‍♂️Run Cadence", formatter: (v) => `${v} spm` },
    avg_bike_cadence: { label: "🚴‍♂️Bike Cadence", formatter: (v) => `${v} rpm` },
    average_swim_cadence: {
      label: "🏊‍♂️Swim Cadence",
      formatter: (v) => `${v} spm`,
    },
    average_push_cadence: {
      label: "🤸‍♂️Push Cadence",
      formatter: (v) => `${v} spm`,
    },
    pushes: { label: "🤸‍♂️Pushes" },
    total_elevation_gain: { label: "⬆️Elev Gain", formatter: (v) => `${v} m` },
    total_elevation_loss: { label: "⬇️Elev Loss", formatter: (v) => `${v} m` },
    activity_name: { label: "Activity" }, // just in case
    id: { label: "ID" }, // won't render
  };

  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(
    new Set(),
  );

  return (
    <div>
      <div
        className={`flex flex-col p-0 md:p-4 w-full h-full space-y-4 ${!hasData ? "opacity-50" : ""}`}
      >
        <p className="pb-2">Count: {hasData ? activities!.length : 0}</p>

        {displayActivities.map((activity: Activity) => {
          const toggleActivity = (id: string) => {
            setExpandedActivities((prev) => {
              const newSet = new Set(prev);
              if (newSet.has(id)) newSet.delete(id);
              else newSet.add(id);
              return newSet;
            });
          };

          return (
            <div
              key={activity.id}
              className="bg-[white]/10 rounded-xl p-4 shadow-lg border border-white/20 text-white cursor-pointer"
              onClick={() => toggleActivity(activity.id)}
            >
              {/* Title row */}
              <div className="flex justify-between items-center">
                <div className="text-lg flex items-baseline gap-2">
                  {activity.activity_name}

                  {/* Click to toggle details */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation(); // prevent toggle expand when clicking details
                      toggleActivity(activity.id);
                    }}
                    className="mt-2 text-sm text-gray-400 cursor-pointer hover:text-white"
                  >
                    {expandedActivities.has(activity.id)
                      ? "- hide details"
                      : "- open details"}
                  </div>
                </div>

                {/* Optional select checkbox */}
                {hasData && (
                  <input
                    type="checkbox"
                    value={activity.id}
                    checked={selectedActivityIds.has(activity.id)}
                    onChange={(e) => {
                      e.stopPropagation(); // prevent toggle expand when clicking checkbox
                      handleActivityToggle(activity.id);
                    }}
                    className="cursor-pointer accent-[#1d9dad] w-5 h-5"
                  />
                )}
              </div>

              {/* Expanded content */}
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
                    },
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
