import React, { useState, useEffect } from 'react';
import { SparklesIcon } from './icons/SparklesIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { AppView } from '../types';

interface MentorSuggestion {
    message: string;
    tool: AppView;
    params?: any;
}

interface MentorSuggestionToastProps {
  suggestion: MentorSuggestion | null;
  onAccept: (tool: AppView, params?: any) => void;
  onClose: () => void;
}

export const MentorSuggestionToast: React.FC<MentorSuggestionToastProps> = ({ suggestion, onAccept, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let visibilityTimer: number;

    if (suggestion) {
      setVisible(true);
      // Auto-close after 30 seconds
      visibilityTimer = window.setTimeout(() => {
        handleClose();
      }, 30000);
    }

    return () => {
      clearTimeout(visibilityTimer);
    };
  }, [suggestion]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 500); // Wait for fade-out animation
  };

  const handleAccept = () => {
    if (suggestion) {
        onAccept(suggestion.tool, suggestion.params);
    }
    handleClose();
  }

  if (!suggestion) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className={`fixed bottom-24 right-6 z-50 w-full max-w-sm transition-all duration-500 ease-in-out ${
        visible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
      }`}
    >
      <div className="bg-[--color-dark-matter]/80 backdrop-blur-md shadow-2xl rounded-xl ring-1 ring-[--color-border]/50 overflow-hidden">
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <SparklesIcon className="w-6 h-6 text-[--color-neural-blue]" />
            </div>
            <div className="ml-3 w-0 flex-1">
              <p className="text-sm font-semibold text-[--color-ghost-white]">AI Mentor Suggestion</p>
              <p className="mt-1 text-sm text-[--color-muted-grey]">{suggestion.message}</p>
              <div className="mt-3 flex gap-3">
                  <button onClick={handleAccept} className="text-xs font-bold bg-[--color-neural-blue] text-[--color-obsidian-slate] px-3 py-1.5 rounded-md hover:opacity-80">
                      Yes, let's go!
                  </button>
                  <button onClick={handleClose} className="text-xs font-bold text-[--color-muted-grey] px-3 py-1.5 rounded-md hover:bg-[--color-border]">
                      Not now
                  </button>
              </div>
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                onClick={handleClose}
                className="inline-flex text-[--color-muted-grey] rounded-md hover:text-[--color-ghost-white] focus:outline-none"
              >
                <span className="sr-only">Close</span>
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
