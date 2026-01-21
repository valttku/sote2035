"use client";

import Modal from "@/components/Modal";
import { useRouter } from "next/navigation";

export default function ChooseDevicePage() {
  const router = useRouter();

  function handleDeviceSelection() {
    // Navigate to homepage (root page) after device selection
    router.push("/");
  }

  return (
    <main className="flex items-center justify-center min-h-screen">
      <Modal onClose={() => router.back()}>
        <h1 className="text-2xl mb-4 text-center">Choose your device</h1>
        <div className="flex flex-col gap-4">
          <button
            className="button-style-blue w-full"
            onClick={handleDeviceSelection}
          >
            Garmin
          </button>
          <button
            className="button-style-blue w-full"
            onClick={handleDeviceSelection}
          >
            Polar
          </button>
          <button
            className="button-style-blue w-full"
            onClick={handleDeviceSelection}
          >
            Skip
          </button>
        </div>
      </Modal>
    </main>
  );
}
