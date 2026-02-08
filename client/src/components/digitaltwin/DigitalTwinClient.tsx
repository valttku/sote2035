"use client";
import { useState } from "react";
import HealthStatsPanel from "./healthStatsPanel";

export type BodyPartId = "brain" | "heart" | "lungs" | "legs";

const BODY_PARTS: Array<{
  id: BodyPartId;
  label: string;
  top: string;
  left: string;
}> = [
  { id: "brain", label: "Brain", top: "3%", left: "50%" },
  { id: "heart", label: "Heart", top: "25%", left: "50%" },
  { id: "lungs", label: "Lungs", top: "22%", left: "35%" },
  { id: "legs", label: "Legs", top: "75%", left: "60%" },
];

export default function DigitalTwinClient() {
  const [selected, setSelected] = useState<BodyPartId | null>(null);

  const [avatarType] = useState<"male" | "female">("male");
  const isFemale = avatarType === "female";

  return (
    <div className="w-full my-auto flex justify-center">
      <div className="flex flex-col w-full max-w-5xl gap-10 min-h-[80vh] p-4">
        {/* Title at the top */}
        <h1 className="text-5xl text-left">Today</h1>

        {/* Main content: avatar + info panel */}
        <div className="flex flex-row items-start justify-center gap-20">
          {/* Avatar + dots on the left */}
          <div className="relative w-1/2 max-w-[200px] sm:w-[45vw] md:ml-40 flex-shrink-0 ">
            <img
              src={isFemale ? "/avatar-female.png" : "/avatar-male.png"}
              alt="Digital twin"
              className="w-full h-auto block"
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
                      : "rgba(203, 215, 249, 0.8)",
                }}
                aria-label={id}
              />
            ))}
          </div>

          {/* Guide + info-panel on the right */}
          <div className="w-1/2 max-w-[320px] p-4 md:p-6 flex flex-col justify-start text-left">
            {!selected && (
              <div className="mb-2">
                <p className="text-sm md:text-base">
                  Select a body part by clicking on a white dot on the body
                </p>
              </div>
            )}

            {selected && (
              <div className="w-full md:max-w-[500px]">
                <HealthStatsPanel
                  selected={selected}
                  onClose={() => setSelected(null)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
