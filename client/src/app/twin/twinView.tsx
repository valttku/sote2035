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
        <div className="min-h-screen p-12">
            <div className="mx-auto flex flex-row items-start justify-start gap-x-20 max-w-[1200px]">
                <h1 className="text-5xl m-10">Today</h1>

                {/* Avatar + dots */}
                <div className="relative w-[230px] mt-[5%] flex-shrink-0">
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
                                        ? "rgba(10, 33, 90, 0.7)"
                                        : "rgba(211, 211, 255, 0.8)",
                            }}
                            aria-label={id}
                        />
                    ))}
                </div>

                {/* Title + panel */}
                <div className="w-[320px] flex-shrink-0">
                    <h1 className="text-[18px] mb-[10px] mt-[70px] p-[10px] rounded-[8px]">
                    Select a body part by clicking on a white dot on the body
                    </h1>

                    {selected && <TwinPanel selected={selected} onClose={() => setSelected(null)} />}
                </div>
            </div>
        </div>
    );
}
