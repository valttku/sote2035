"use client";

import { useEffect, useState, useMemo } from "react";
import AppLayout from "../components/AppLayout";
import HealthStatsPanel, { type BodyPartId } from "../components/healthStatsPanel";
import { useTranslation } from "@/i18n/LanguageProvider";

export default function Home() {
  const { t } = useTranslation();

  const [selected, setSelected] = useState<BodyPartId | null>(null);
  const [avatarType, setAvatarType] = useState<"male" | "female">("male"); // default male

  // Fetch user profile on mount to get gender
  useEffect(() => {
    fetch("/api/v1/settings", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.gender === "female") setAvatarType("female");
      })
      .catch(console.error);
  }, []);

  const isFemale = avatarType === "female";

  // Memoize BODY_PARTS to use translated labels
  const BODY_PARTS: Array<{ id: BodyPartId; label: string; top: string; left: string }> =
    useMemo(
      () => [
        { id: "brain", label: t.home.bodyParts.brain, top: "3%", left: "50%" },
        { id: "heart", label: t.home.bodyParts.heart, top: "25%", left: "50%" },
        { id: "lungs", label: t.home.bodyParts.lungs, top: "22%", left: "35%" },
        { id: "legs", label: t.home.bodyParts.legs, top: "75%", left: "60%" },
      ],
      [t]
    );

  return (
    <AppLayout>
      <div className="w-full flex justify-center">
        <div className="flex flex-col w-full max-w-5xl gap-10 p-4 flex-1">
          {/* Page title */}
          <h1 className="text-5xl text-left">{t.home.title}</h1>

          {/* Main content: avatar + info panel */}
          <div className="flex flex-row items-start justify-center gap-70">
            {/* Avatar + body part dots */}
            <div className="relative w-1/2 max-w-[200px] sm:w-[45vw] flex-shrink-0 md:translate-x-50">
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
                        : "rgba(203, 215, 249, 0.8)",
                  }}
                  aria-label={id}
                  title={BODY_PARTS.find((bp) => bp.id === id)?.label} // show label on hover
                />
              ))}
            </div>

            {/* Right panel */}
            <div className="w-1/2 max-w-[400px] p-4 md:p-6 flex flex-col justify-start text-left">
              {!selected && (
                <div className="mb-2">
                  <p className="text-sm md:text-base">{t.home.selectBodyPart}</p>
                </div>
              )}

              {selected && (
                <div className="w-full">
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
    </AppLayout>
  );
}
