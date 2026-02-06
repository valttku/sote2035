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
    <div className="min-h-screen w-full flex flex-col items-center pt-10 px-5 md:px-10">
      <h1 className="text-5xl mb-10 w-full text-left">
        Today
      </h1>

      <div className="flex flex-row items-center justify-center w-full gap-10 md:gap-[15%]">
        {/* Avatar + dots */}
        <div className="relative w-[60vw] max-w-[250px] sm:w-[50vw] md:w-[40vw] flex-shrink-0">
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

        {/* Guide + info-panel */}
        <div className="w-full max-w-[350px] min-h-[300px] flex-shrink-0 p-4 md:p-6 mb-70">
          <p className="mb-6 text-sm md:text-base">
            Select a body part by clicking on a white dot on the body
          </p>

          {selected && (
            <HealthStatsPanel
              selected={selected}
              onClose={() => setSelected(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
