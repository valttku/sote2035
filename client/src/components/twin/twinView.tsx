"use client";
import { useState } from "react";
import TwinPanel from "./twinPanel";

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

export default function TwinView() {
  const [selected, setSelected] = useState<BodyPartId | null>(null);

  const [avatarType, setAvatarType] = useState<"male" | "female">("male");
  const isFemale = avatarType === "female";
  const avatarWidth = isFemale ? 208 : 244;

  return (
    <div className="min-h-screen w-full min-w-0 mx-auto overflow-x-hidden">
      <div className="flex items-start justify-start gap-[12%] min-w-0 ">
        <h1 className="text-5xl mt-10 ml-10 shrink-0">Today</h1>

        {/* Avatar + dots */}
        <div className="relative w-[230px] mt-45 shrink-0">
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
                    : "rgba(211, 211, 255, 0.8)",
              }}
              aria-label={id}
            />
          ))}
        </div>

        {/* Guide + info-panel */}
        <div className="w-[320px] flex-shrink-0 mt-30 p-5">
          <h2 className="mb-10 ml-2">
            Select a body part by clicking on a white dot on the body
          </h2>

          {selected && (
            <TwinPanel selected={selected} onClose={() => setSelected(null)} />
          )}
        </div>
      </div>
    </div>
  );
}
