"use client";

import type { BodyPartId } from "./twinView";

type Props = {
  selected: BodyPartId;
  onClose: () => void;
};

const TITLE: Record<BodyPartId, string> = {
  brain: "Brain",
  heart: "Heart",
  lungs: "Lungs",
  legs: "Legs",
};

const MOCK: Record<BodyPartId, Record<string, string | number>> = {
  heart: { "HR avg": 62, HRV: 78, "Resting HR": 48 },
  lungs: { "Resp rate": 14, "SpO₂": "98%" },
  brain: { "Sleep (h)": 7.2, Stress: "Low" },
  legs: { Steps: 12000 },
};

export default function TwinPanel({ selected, onClose }: Props) {
  const metrics = MOCK[selected];

  return (
    <div className="panel-animation width-320px p-4 pt-2 rounded-2xl shadow-lg bg-indigo-950/70 text-white border border-[rgba(179,196,243,0.8)]">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl mb-2">{TITLE[selected]}</h1>
        <button className="cursor-pointer mb-5" onClick={onClose}>
          ✕
        </button>
      </div>

      <ul>
        {Object.entries(metrics).map(([k, v]) => (
          <li key={k}>
            <span className="font-semibold">{k}: </span>
            {v}
          </li>
        ))}
      </ul>

      {/* animation for panel */}
      <style jsx>{`
        .panel-animation {
          animation: fade 0.3s ease-in-out forwards;
        }

        @keyframes fade {
          from {
            opacity: 0;
          }
          to {
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
}
