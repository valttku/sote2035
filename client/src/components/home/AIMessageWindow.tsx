import React from "react";
interface AIMessageWindowProps {
  message: string;
  title: string;
  generatingMessage?: string;
  placeholder?: string;
  loading?: boolean;
  open: boolean;
  onClose: () => void;
}

const AIMessageWindow: React.FC<AIMessageWindowProps> = ({
  message,
  title,
  generatingMessage,
  placeholder,
  loading,
  open,
  onClose,
}) => {
  if (!open) return null;
  return (
    <div className="fixed bottom-20 right-0 z-50 flex items-end justify-center px-2 lg:bottom-24 lg:right-2 lg:left-auto lg:justify-end">
      <div className="ui-component-styles relative mb-2 p-4 shadow-md min-w-[140px] max-w-[90vw] max-h-[70vh] overflow-auto text-xs sm:min-w-[320px] sm:max-w-[400px] sm:p-4 sm:text-base">
        <button
          className="absolute top-2 right-2 text-white p-1"
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

        <h3 className="text-center mb-2 text-sm sm:text-lg border-b pb-1">
          {title}
        </h3>

        {loading ? (
          <p className="italic text-xs sm:text-base">{generatingMessage}</p>
        ) : message ? (
          <p className="whitespace-pre-line text-xs sm:text-base">{message}</p>
        ) : (
          <p className="text-xs sm:text-base">{placeholder}</p>
        )}
      </div>
    </div>
  );
};

export default AIMessageWindow;
