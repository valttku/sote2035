"use client";

import Modal from "@/components/Modal";
import { useRouter } from "next/navigation";

export default function ChooseServicePage() {
  const router = useRouter();

  async function selectService(provider: string) {
    try {
      if (provider === "polar") {
        // Go straight to Polar OAuth
        window.location.href = `/api/v1/integrations/polar/connect`;
      } else if (provider === "garmin") {
        // Go straight to Garmin OAuth
        window.location.href = `/api/v1/integrations/garmin/connect`;
      } else if (provider === "skip") {
        router.push("/");
      } else {
        alert("This provider is not supported yet");
      }
    } catch {
      alert("Failed to connect to server");
    }
  }

  // Modal cannot be closed without choosing a service
  function closeModal() {
    alert("Please choose a service to proceed.");
  }

  return (
    <main className="flex items-center justify-center min-h-screen">
      <Modal onClose={closeModal}>
        <h1 className="text-2xl md:text-3xl mb-4 text-center">
          {/* Responsive heading: text-2xl mobile, text-3xl desktop */} 
          Choose your device</h1>

        <div className="flex flex-col md:flex-row gap-4">
          {/* Responsive button container: stacked on mobile, horizontal on desktop */}

          {/* Garmin Button */}
          <button
            className="
              bg-[var(--button-blue-bg)] 
              hover:bg-[var(--button-blue-hover)] 
              text-white 
              rounded-md 
              px-4 py-2 
              md:px-6 md:py-3 
              w-full
            "
            onClick={() => selectService("garmin")}
          >
            Garmin
          </button>

          {/* Polar Button */}
          <button
            className="
              bg-[var(--button-blue-bg)] 
              hover:bg-[var(--button-blue-hover)] 
              text-white 
              rounded-md 
              px-4 py-2 
              md:px-6 md:py-3 
              w-full
            "
            onClick={() => selectService("polar")}
          >
            Polar
          </button>

          {/* Skip Button */}
          <button
            className="
              bg-[var(--cancel-button-bg)] 
              hover:bg-[var(--cancel-button-hover)] 
              text-white 
              rounded-md 
              px-4 py-2 
              md:px-6 md:py-3 
              w-full
            "
            onClick={() => selectService("skip")}
          >
            Skip
          </button>
        </div>
      </Modal>
    </main>
  );
}
