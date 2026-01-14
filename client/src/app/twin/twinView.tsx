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
    { id: "brain", label: "Brain", top: "3%", left: "45%" },
    { id: "heart", label: "Heart", top: "25%", left: "50%" },
    { id: "lungs", label: "Lungs", top: "22%", left: "35%" },
    { id: "legs", label: "Legs", top: "75%", left: "62%" },
];

export default function TwinView() {
    const [selected, setSelected] = useState<BodyPartId | null>(null);

    const [avatarType, setAvatarType] = useState<"male" | "female">("male");
    const isFemale = avatarType === "female";
    const avatarWidth = isFemale ? 208 : 244;

    return (
        <div className="avatar-panel">
            {/* Avatar + dots */}
            <div className="avatar-wrapper">
                <img
                    src={isFemale ? "/avatar-female.png" : "/avatar-male.png"}
                    alt="Digital twin"
                    style={{ width: `${avatarWidth}px`, height: "737px", display: "block" }}
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
                                    ? "rgba(19, 19, 133, 0.3)"
                                    : "rgba(213, 213, 255, 0.8)",
                        }}
                        aria-label={id}
                    />
                ))}
            </div>

            {/* Title + panel */}
            <div className="title-and-panel" style={{ width: 320, marginLeft: "10%" }}>
                <h1>Select a body part by clicking on a white dot on the body</h1>
                {selected && (
                    <TwinPanel
                        selected={selected}
                        onClose={() => setSelected(null)}
                    />
                )}
            </div>

            <style jsx>{`
                .avatar-panel {
                    display: flex;
                    align-items: flex-start;
                    width: auto;
                    min-height: 100vh;
                    padding: 50px;
                }

                .avatar-wrapper {
                    position: relative;
                    width: 230px;
                    margin-left: 10%;
                    margin-top: 5%;
                }

                .title-and-panel h1 {
                    font-size: 18px;
                    color: #470ad6;
                    background: #e2e0ff;
                    margin-bottom: 10px;
                    margin-top: 20px;
                    padding: 10px;
                    border-radius: 8px;
                }
            `}</style>
        </div>
    );
}
