"use client";

import Modal from "@/components/Modal";
import { useRouter } from "next/navigation";

export default function ChooseServicePage() {
  const router = useRouter();

  async function selectService(provider: string) {
    try {
      if (provider === "polar") {
        // Go straight to Polar OAuth
        window.location.href = "/api/v1/integrations/polar/connect";
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
        <h1 className="text-2xl mb-4 text-center">Choose your device</h1>

        <h2>Right now only polar linking works!</h2>

        <div className="flex flex-col gap-4">
          <button
            className="button-style-blue w-full"
            onClick={() => selectService("garmin")}
          >
            Garmin
          </button>
          <button
            className="button-style-blue w-full"
            onClick={() => selectService("polar")}
          >
            Polar
          </button>
          <button
            className="button-style-blue w-full"
            onClick={() => selectService("skip")}
          >
            Skip
          </button>
        </div>
      </Modal>
    </main>
  );
}
