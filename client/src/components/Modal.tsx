"use client";
import { ReactNode } from "react";

type ModalProps = {
  children: ReactNode;
  onClose: () => void;
};

export default function Modal({ children, onClose }: ModalProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50">
      <div
        className="
          bg-white p-6 rounded shadow-md
          w-full max-w-md
          max-h-[90vh] overflow-y-auto
          dark:text-black
        "
      >
        <button
          type="button"
          onClick={onClose}
          className="mb-2"
        >
          Close
        </button>
        {children}
      </div>
    </div>
  );
}
