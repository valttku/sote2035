"use client";

export type Activity = {
  id: string;
  activity_name: string;
  duration_in_seconds: number;
  distance_in_meters?: number;
  active_kilocalories?: number;
  average_heart_rate?: number;
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

  // Use dummy activities if none exist
  const displayActivities: Activity[] = hasData
    ? activities!
    : [
        {
          id: "empty-1",
          activity_name: "Activity Name",
          duration_in_seconds: 0,
          distance_in_meters: 0,
          active_kilocalories: 0,
          average_heart_rate: 0,
        },
        {
          id: "empty-2",
          activity_name: "Activity Name",
          duration_in_seconds: 0,
          distance_in_meters: 0,
          active_kilocalories: 0,
          average_heart_rate: 0,
        },
      ];

  const handleActivityToggle = (activityId: string) => {
    const newSelected = new Set(selectedActivityIds);
    if (newSelected.has(activityId)) {
      newSelected.delete(activityId);
    } else {
      newSelected.add(activityId);
    }
    onActivitiesSelected?.(newSelected);
  };

  return (
    <div>
      <div
        className={`flex flex-col p-0 md:p-4 w-full h-full space-y-4 ${!hasData ? "opacity-50" : ""}`}
      >
        <p className="pb-2">Count: {hasData ? activities!.length : 0}</p>
        {displayActivities.map((activity: Activity) => (
          <div
            key={activity.id}
            className="bg-[white]/10 rounded-xl p-4 shadow-lg border border-white/20 text-white"
          >
            {/* Title row */}
            <div className="flex justify-between items-center">
              <label
                htmlFor={`activity-${activity.id}`}
                className="text-lg cursor-pointer flex items-baseline gap-2"
              >
                {activity.activity_name}
                <span className="text-sm text-gray-400">
                  ({(activity.duration_in_seconds / 60).toFixed(1)} min)
                </span>
              </label>

              {/* Select button */}
              {hasData && (
                <input
                  type="checkbox"
                  name="activity-select"
                  id={`activity-${activity.id}`}
                  value={activity.id}
                  checked={selectedActivityIds.has(activity.id)}
                  onChange={() => handleActivityToggle(activity.id)}
                  className="cursor-pointer accent-[#1d9dad] w-5 h-5"
                />
              )}
            </div>

            {/* Other stats */}
            <div className="flex flex-row mt-2 text-sm text-gray-200 items-start justify-start gap-4">
              {activity.distance_in_meters != null && (
                <div>
                  🛣 Distance: {(activity.distance_in_meters / 1000).toFixed(2)}{" "}
                  km
                </div>
              )}
              {activity.active_kilocalories != null && (
                <div>🔥 Calories: {activity.active_kilocalories} kcal</div>
              )}
              {activity.average_heart_rate != null && (
                <div>❤️ Avg HR: {activity.average_heart_rate} bpm</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
