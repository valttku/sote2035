"use client";
import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import AIMessageWindow from "../components/home/AIMessageWindow";
import DigitalTwin from "../components/home/DigitalTwin";
import AIMessageButton from "../components/home/AIMessageButton";
import InfoWindow from "../components/home/InfoWindow";
import InfoButton from "../components/home/InfoButton";
import HealthStatsPanel, {
  BodyPartId,
} from "../components/home/HealthStatsPanel";
import { useTranslation } from "@/i18n/LanguageProvider";

export default function Home() {
  const { t } = useTranslation();

  const [avatarType, setAvatarType] = useState<"male" | "female">("male");
  const [alerts, setAlerts] = useState<Record<BodyPartId, boolean>>({
    brain: false,
    heart: false,
    lungs: false,
    legs: false,
  });
  const [selected, setSelected] = useState<BodyPartId | null>(null);
  const [aiMessage, setAIMessage] = useState<string | null>(null);
  const [aiStatus, setAIStatus] = useState<
    "none" | "generated" | "quota_exceeded" | "error"
  >("none");
  const [loadingAI, setLoadingAI] = useState(true);
  const [showAIWindow, setShowAIWindow] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [isTwinDataReady, setIsTwinDataReady] = useState(false);
  const [isAvatarImageReady, setIsAvatarImageReady] = useState(false);

  // Fetch summary once when component mounts
  useEffect(() => {
    const date = new Date().toISOString().split("T")[0];
    let cancelled = false;

    async function fetchSummary(requestAI = false) {
      try {
        const aiParam = requestAI ? "&ai=1" : "";
        const res = await fetch(
          `/api/v1/home?date=${date}&part=summary${aiParam}`,
          { credentials: "include" },
        );
        if (!res.ok) return;
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;

        const alertsResp = json.alerts ?? {};
        setAlerts({
          brain: !!alertsResp.brain,
          heart: !!alertsResp.heart,
          lungs: !!alertsResp.lungs,
          legs: !!alertsResp.legs,
        });

        if (requestAI) {
          setAIMessage(json.aiMessage || "");
          setAIStatus(json.aiStatus || "none");
          setLoadingAI(false);

          const gender = json.user?.gender;
          const newAvatarType = gender === "female" ? "female" : "male";
          setAvatarType((prev) => {
            if (newAvatarType !== prev) setIsAvatarImageReady(false);
            return newAvatarType;
          });
          setIsTwinDataReady(true);
        }
      } catch (err) {
        console.error("fetchSummary", err);
        if (requestAI) {
          setLoadingAI(false);
          setIsTwinDataReady(true);
        }
      }
    }

    fetchSummary(true);
    return () => {
      cancelled = true;
    };
  }, []);

  const isFemale = avatarType === "female";

  const BODY_PARTS: {
    id: BodyPartId;
    label: string;
    top: string;
    left: string;
  }[] = [
    { id: "brain", label: t.home.bodyParts.brain, top: "3%", left: "50%" },
    { id: "heart", label: t.home.bodyParts.heart, top: "25%", left: "50%" },
    { id: "lungs", label: t.home.bodyParts.lungs, top: "22%", left: "35%" },
    { id: "legs", label: t.home.bodyParts.legs, top: "75%", left: "60%" },
  ];

  return (
    <AppLayout>
      <main className="w-full flex justify-center">
        <div className="flex flex-col w-full max-w-5xl gap-10 p-4 flex-1">
          <h1 className="text-5xl text-left">{t.home.title}</h1>

          <div className="mt-4 md:mt-10 lg:mt-14 flex justify-center w-full">
            <div className="relative flex flex-col md:flex-row items-center md:items-start">
              <div className="relative">
                {(!isTwinDataReady || !isAvatarImageReady) && (
                  <div className="min-h-[50vh] flex items-center justify-center text-md">
                    {t.home.loading}
                  </div>
                )}

                {isTwinDataReady && (
                  <div
                    className={`transition-opacity duration-300 ${isAvatarImageReady ? "opacity-100" : "opacity-0 pointer-events-none absolute inset-0"}`}
                  >
                    <DigitalTwin
                      BODY_PARTS={BODY_PARTS}
                      selected={selected}
                      setSelected={setSelected}
                      alerts={alerts}
                      isFemale={isFemale}
                      onAvatarLoad={() => setIsAvatarImageReady(true)}
                    />
                  </div>
                )}
              </div>

              {selected && (
                <div className="w-full mt-6 md:absolute md:left-full md:ml-8 md:top-0 md:w-[420px]">
                  <HealthStatsPanel
                    selected={selected}
                    onClose={() => setSelected(null)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="fixed bottom-6 right-25 pointer-events-auto">
          <InfoButton
            onClick={() =>
              setShowInfo((prev) => {
                if (!prev) setShowAIWindow(false);
                return !prev;
              })
            }
          />
        </div>

        <div className="fixed bottom-6 right-6 pointer-events-auto">
          <AIMessageButton
            aiStatus={aiStatus}
            onClick={() =>
              setShowAIWindow((prev) => {
                if (!prev) setShowInfo(false);
                return !prev;
              })
            }
          />
        </div>

        {/* Info and AI windows */}
        <InfoWindow
          info={t.home.info}
          title={t.home.guideTitle}
          open={showInfo}
          onClose={() => setShowInfo(false)}
        />
        <AIMessageWindow
          message={aiMessage || ""}
          title={t.home.aiTitle}
          generatingMessage={t.home.generatingMessage}
          placeholder={t.home.noMessage}
          loading={loadingAI}
          aiStatus={aiStatus}
          open={showAIWindow}
          onClose={() => setShowAIWindow(false)}
        />
      </main>
    </AppLayout>
  );
}
