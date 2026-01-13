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
  feet: "Feet",
};

const MOCK: Record<BodyPartId, Record<string, string | number>> = {
  heart: { "HR avg": 62, HRV: 78, "Resting HR": 48 },
  lungs: { "Resp rate": 14, "SpO₂": "98%" },
  brain: { "Sleep (h)": 7.2, Stress: "Low" },
  feet: { Steps: 12000 },
};

export default function TwinPanel({ selected, onClose }: Props) {
  const metrics = MOCK[selected];

  return (
        <div className="panel" style={{ minWidth: 320 }}>
            <div className="panel-body">
                <div className="title-and-close-button">
                    <h1 className="panel-title">{TITLE[selected]}</h1>
                    <button className="close-button" onClick={onClose}>✕</button>
                </div>

                <hr />

                <ul className="metrics-list">
                    {Object.entries(metrics).map(([k, v]) => (
                        <li key={k}>
                        <span className="metric-name">{k}: </span>
                        {v}
                        </li>
                    ))}
                </ul>
            </div>

            {/* style is here for now */}
            <style jsx>{`
                .panel {
                    width: 320px;
                    color: white;
                    border-radius: 10px;
                    padding: 16px;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
                    background: radial-gradient(circle at top left, #6c6efc, #48499f);
                    opacity: 0.9;
                }

                .title-and-close-button {
                    display: flex;
                    justify-content: space-between;
                }

                .close-button:hover {
                    cursor: pointer;
                }
                
                .metrics-list {
                    list-style: none;
                    padding-top: 5px;
                }

                .panel-title {
                    font-size: 18px;
                }
                
            `}</style>
    </div>
  );
}
