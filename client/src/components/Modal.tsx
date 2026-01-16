"use client";
import { ReactNode } from "react";

type ModalProps = {
  children: ReactNode;
  onClose: () => void;
};

export default function Modal({ children, onClose }: ModalProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-indigo-950/50 backdrop-blur-sm">
      <div
        className="
          ui-component-styles
          p-6 rounded-2xl
          w-full max-w-md
          max-h-[90vh] overflow-y-auto
        "
      >
        <button
          type="button"
          onClick={onClose}
          className="mb-2 cursor-pointer float-right"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
