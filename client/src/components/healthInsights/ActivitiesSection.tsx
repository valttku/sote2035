export type Activity = {
  id: string;
  activity_name: string;
  duration_in_seconds: number;
  distance_in_meters?: number;
  calories?: number;
  start_time_in_seconds: number;
  avg_heart_rate?: number;
};

type ActivitiesSectionProps = {
  activities?: Activity[];
};

export function ActivitiesSection({ activities }: ActivitiesSectionProps) {
  return (
    <div className="">
    <p>Count: {activities?.length || 0}</p>

      {activities && activities.length > 0 ? (
        <div className="space-y-3">
          {activities.map((activity: Activity) => (
            <div
              key={activity.id}
              className="border-l-4 border-[#1aa5b0] bg-white/70 rounded-lg p-4 shadow-sm mt-2 mb-2"
            >
              <div className="font-semibold text-lg text-black">
                {activity.activity_name}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-sm">
                <div>
                  <span className="text-black">Duration:</span>{" "}
                  <span className="text-black">
                    {(activity.duration_in_seconds / 60).toFixed(1)} min
                  </span>
                </div>

                {activity.distance_in_meters && (
                  <div>
                    <span className="text-black">Distance:</span>{" "}
                    <span className="text-black">
                      {(activity.distance_in_meters / 1000).toFixed(2)} km
                    </span>
                  </div>
                )}

                {activity.calories && (
                  <div>
                    <span className="text-black">Calories:</span>{" "}
                    <span className="text-black">{activity.calories}</span>
                  </div>
                )}

                {activity.avg_heart_rate && (
                  <div>
                    <span className="text-black">Avg HR:</span>{" "}
                    <span className="text-black">
                      {activity.avg_heart_rate} bpm
                    </span>
                  </div>
                )}
              </div>

              <div className="text-xs text-black mt-2">
                {new Date(
                  activity.start_time_in_seconds * 1000,
                ).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-black">No activities found</div>
      )}
    </div>
  );
}
