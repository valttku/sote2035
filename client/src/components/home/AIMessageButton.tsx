import React from "react";

interface AIMessageButtonProps {
  hasNewMessage: boolean;
  onClick: () => void;
}

const AIMessageButton: React.FC<AIMessageButtonProps> = ({ hasNewMessage, onClick }) => (
  <button
    className="fixed bottom-6 right-6 bg-[#31c2d5] hover:bg-[#28a0b0] text-white rounded-full shadow-lg p-4 flex items-center justify-center"
    style={{ width: 56, height: 56 }}
    aria-label="Open AI Health Assistant"
    onClick={onClick}
  >
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
    {/* Red dot indicator for new AI message */}
    {hasNewMessage && (
      <span
        className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"
        style={{ pointerEvents: "none" }}
        aria-label="New AI message"
      />
    )}
  </button>
);

export default AIMessageButton;
