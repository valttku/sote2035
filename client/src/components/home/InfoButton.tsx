import React from "react";

interface InfoButtonProps {
  onClick: () => void;
}

const InfoButton: React.FC<InfoButtonProps> = ({ onClick }) => (
  <button
    className="fixed bottom-6 right-25 bg-[#31c2d5] hover:bg-[#28a0b0] text-white rounded-full shadow-lg p-4 flex items-center justify-center"
    style={{ width: 56, height: 56 }}
    aria-label="Show Info Guide"
    onClick={onClick}
  >
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="8" />
    </svg>
  </button>
);

export default InfoButton;
