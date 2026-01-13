"use client";
import { useState } from "react";
import TwinPanel from "./twinPanel";

export type BodyPartId = "brain" | "heart" | "lungs" | "feet";

const PARTS: { id: BodyPartId; label: string }[] = [
  { id: "brain", label: "Brain" },
  { id: "heart", label: "Heart" },
  { id: "lungs", label: "Lungs" },
  { id: "feet", label: "Feet" },
];

export default function TwinView() {
  const [selected, setSelected] = useState<BodyPartId | null>(null);

    return (
        <div className="avatar-buttons-panel">

            {/* AVATAR */}
            <div className="avatar" style={{ width: 250, marginLeft: "10%", display: "block" }}>
                <img
                src="/avatar.png"
                alt="Digital twin"
                style={{ width: "100%", height: "auto", display: "block" }}
                />
            </div>

            {/* BUTTONS */}
            <div className="title-and-buttons" style={{ width: 320, marginLeft: "10%", display: "block" }}>
                <h1>Select a body part:</h1>

                <div className="body-part-buttons">
                    <button className="bodypart-name" onClick={() => setSelected("brain")}>brain</button>
                    <button className="bodypart-name" onClick={() => setSelected("heart")}>heart</button>
                    <button className="bodypart-name" onClick={() => setSelected("lungs")}>lungs</button>
                    <button className="bodypart-name" onClick={() => setSelected("feet")}>feet</button>
                </div>
                
                <div>
                    {selected && <TwinPanel selected={selected} onClose={() => setSelected(null)} />}
                </div>
            </div>

        {/* style is here for now */}
        <style jsx>{`
            .avatar-buttons-panel {
                display: flex;
                align-items: flex-start;
                gap: 40px;
                margin-top: 20px;
            }

            .title-and-buttons h1 {
                margin-bottom: 10px;
                font-size: 24px;
                color: #470ad6;
            }
            
            .body-part-buttons {
                margin-bottom: 10px;
                color: #470ad6;
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
            }

            .bodypart-name {
                font-size: 20px;
                padding: 5px;
                border-radius: 10px; 
                transition: all 0.2s ease;
            }

            .bodypart-name:hover {
                background: #d3d3fc;
                cursor: pointer;
            }

            .bodypart-name.active {
                background: #d3d3fc;
            }

        `}</style>

        </div>
    );
}