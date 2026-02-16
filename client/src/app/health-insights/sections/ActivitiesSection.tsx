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
      <p className="pb-2">Count: {activities?.length || 0}</p>

      {activities && activities.length > 0 ? (
        <div className="space-y-4 w-full">
          {activities.map((activity: Activity) => (
            <div
              key={activity.id}
              className="border-l-4 border-l-[#31c2d5] bg-[#1e1c4f]/40  rounded-xl 
              p-4 shadow-md hover:shadow-lg hover:bg-[#2a2a60]/80  
              transition-all duration-200 cursor-pointer"
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

                {/* Select button on the right */}
                <input
                  type="checkbox"
                  name="activity-select"
                  id={`activity-${activity.id}`}
                  value={activity.id}
                  checked={selectedActivityIds.has(activity.id)}
                  onChange={() => handleActivityToggle(activity.id)}
                  className="cursor-pointer accent-[#1d9dad] w-5 h-5 "
                />
              </div>

              {/* Other stats */}
              <div className="grid grid-cols-3 mt-2 text-sm text-gray-200">
                {activity.distance_in_meters != null && (
                  <div className="flex items-center gap-1">
                    🛣 Distance:{" "}
                    {(activity.distance_in_meters / 1000).toFixed(2)} km
                  </div>
                )}
                {activity.active_kilocalories != null && (
                  <div className="flex items-center gap-1">
                    🔥 Calories: {activity.active_kilocalories} kcal
                  </div>
                )}
                {activity.average_heart_rate != null && (
                  <div className="flex items-center gap-1">
                    ❤️ Avg HR: {activity.average_heart_rate} bpm
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
