import React from "react";
import { BodyPartId } from "./HealthStatsPanel";

interface DigitalTwinProps {
  BODY_PARTS: Array<{
    id: BodyPartId;
    label: string;
    top: string;
    left: string;
  }>;
  selected: BodyPartId | null;
  setSelected: (id: BodyPartId) => void;
  alerts: Record<BodyPartId, boolean>;
  isFemale: boolean;
}

const DigitalTwin: React.FC<DigitalTwinProps> = ({
  BODY_PARTS,
  selected,
  setSelected,
  alerts,
  isFemale,
}) => (
  <div className="relative w-1/2 max-w-[200px] min-w-[200px] flex-shrink-0">
    <img
      src={isFemale ? "/avatar-female.png" : "/avatar-male.png"}
      alt="Digital twin"
      className="w-full max-h-[60vh] object-contain block"
    />
    {BODY_PARTS.map(({ id, top, left }) => (
      <div
        key={id}
        onClick={() => setSelected(id)}
        style={{
          position: "absolute",
          width: "8%",
          height: "3%",
          borderRadius: "50%",
          cursor: "pointer",
          top,
          left,
          background:
            selected === id
              ? "rgba(10, 33, 90, 0.7)"
              : alerts[id]
                ? "rgba(220, 38, 81, 0.95)"
                : "rgba(203, 215, 249, 0.8)",
        }}
        className={alerts[id] ? "animate-pulse" : undefined}
        aria-label={id}
      />
    ))}
  </div>
);

export default DigitalTwin;
