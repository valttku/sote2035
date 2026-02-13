"use client";
import { ReactNode } from "react";

type ModalProps = {
  children: ReactNode;
  onClose: () => void;
};

export default function Modal({ children, onClose }: ModalProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div
        className="
          ui-component-styles
          p-6 rounded-2xl
          w-full max-w-xl
          max-h-[90vh] overflow-y-auto
          translate-x-80
        "
        // Dark mode variables applied here
        style={{
          backgroundColor: "var(--input-bg)",
          color: "var(--foreground)",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="mb-2 cursor-pointer float-right"
        >
          ✕
        </button>

        {/* Modal content */}
        {children}
      </div>
    </div>
  );
}
