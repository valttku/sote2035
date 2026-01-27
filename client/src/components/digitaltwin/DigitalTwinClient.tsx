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
  { id: "brain", label: "Brain", top: "3%", left: "39%" },
  { id: "heart", label: "Heart", top: "25%", left: "40%" },
  { id: "lungs", label: "Lungs", top: "22%", left: "30%" },
  { id: "legs", label: "Legs", top: "75%", left: "52%" },
];

export default function DigitalTwinClient() {
  const [selected, setSelected] = useState<BodyPartId | null>(null);

  const [avatarType] = useState<"male" | "female">("male");
  const isFemale = avatarType === "female";
  const avatarWidth = isFemale ? 208 : 244;

  return (
    <div className="min-h-screen w-full min-w-0 mx-auto overflow-x-hidden m-10">
      <div className="flex items-start justify-between min-w-0 flex-col md:flex-row mr-[20%]">
        <h1 className="text-5xl ml-10 shrink-0">Today</h1>

        {/* Avatar + dots */}
        <div className="relative w-[230px] mt-10 md:mt-45 ml-[10%] md:ml-[5%] shrink-0">
          <img
            src={isFemale ? "/avatar-female.png" : "/avatar-male.png"}
            alt="Digital twin"
            style={{
              width: `${avatarWidth * 0.8}px`,
              height: "auto",
              display: "block",
            }}
           
          />

          {BODY_PARTS.map(({ id, top, left }) => (
            <div
              key={id}
              onClick={() => setSelected(id)}
              style={{
                position: "absolute",
                width: 20,
                height: 20,
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
        <div className="w-full max-w-[320px] flex-shrink-0 mt-5 md:mt-30 p-5">
          <p className="mb-10 ml-2">
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
