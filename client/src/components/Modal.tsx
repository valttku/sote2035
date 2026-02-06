"use client";
import { ReactNode } from "react";

type ModalProps = {
  children: ReactNode;
  onClose: () => void;
};

export default function Modal({ children, onClose }: ModalProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-indigo-950/30 backdrop-blur-xl">
      <div
        // Responsive UI added
        className="ui-component-styles 
          mx-4 sm:mx-0 p-4 sm:p-6
          w-full max-w-md
          rounded-2xl
          max-h-[90vh] overflow-y-auto
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
