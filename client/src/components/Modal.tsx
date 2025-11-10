"use client";
import { ReactNode } from "react";

type ModalProps = {
  children: ReactNode;
  onClose: () => void;
};

export default function Modal({ children, onClose }: ModalProps) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded shadow-md w-80"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
