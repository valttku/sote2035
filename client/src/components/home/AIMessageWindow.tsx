import React from "react";

interface AIMessageWindowProps {
  message: string;
  loading?: boolean;
  open: boolean;
  onClose: () => void;
}

const AIMessageWindow: React.FC<AIMessageWindowProps> = ({
  message,
  loading,
  open,
  onClose,
}) => {
  if (!open) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-end justify-end">
      <div className="relative p-4 rounded-lg bg-[#1e1c4f]/20 border-[2px] border-[#31c2d5] shadow-md min-w-[320px] max-w-[400px]">
        <button
          className="absolute top-2 right-2 text-[#31c2d5] hover:text-[#28a0b0]"
          aria-label="Close AI Message"
          onClick={onClose}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <h3 className="font-bold mb-2 text-[#31c2d5]">AI Health Assistant</h3>
        {loading ? (
          <div className="text-white">Generating your AI message...</div>
        ) : message ? (
          <div className="text-white whitespace-pre-line">{message}</div>
        ) : (
          <div className="text-white">No message available.</div>
        )}
      </div>
    </div>
  );
};

export default AIMessageWindow;
