import React, { useState, useEffect } from 'react';
import { MarketUpdate } from '../types';
import { XMarkIcon } from './icons/XMarkIcon';
import { SignalIcon } from './icons/SignalIcon';
import { NewspaperIcon } from './icons/NewspaperIcon';

interface MarketUpdateToastProps {
  update: MarketUpdate | null;
  onClose: () => void;
}

export const MarketUpdateToast: React.FC<MarketUpdateToastProps> = ({ update, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let visibilityTimer: number;
    let cleanupTimer: number;

    if (update) {
      setVisible(true);
      visibilityTimer = window.setTimeout(() => {
        setVisible(false);
        // After fade-out, call onClose to clear the update from parent state
        cleanupTimer = window.setTimeout(onClose, 500); 
      }, 20000); // Show for 20 seconds
    }

    return () => {
      clearTimeout(visibilityTimer);
      clearTimeout(cleanupTimer);
    };
  }, [update, onClose]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 500);
  };

  if (!update) {
    return null;
  }

  const Icon = update.type === 'pulse' ? SignalIcon : NewspaperIcon;
  const iconColor = update.type === 'pulse' ? 'text-[--color-focus-gold]' : 'text-[--color-neural-blue]';

  return (
    <div
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-50 w-full max-w-md transition-all duration-500 ease-in-out ${
        visible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
      }`}
    >
      <div className="bg-[--color-dark-matter]/80 backdrop-blur-md shadow-2xl rounded-xl ring-1 ring-[--color-border]/50 overflow-hidden">
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>
            <div className="ml-3 w-0 flex-1">
              <p className="text-sm font-semibold text-[--color-ghost-white] truncate">{update.title}</p>
              <p className="mt-1 text-sm text-[--color-muted-grey]">{update.content}</p>
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                onClick={handleClose}
                className="inline-flex text-[--color-muted-grey] rounded-md hover:text-[--color-ghost-white] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[--color-dark-matter] focus:ring-[--color-neural-blue]"
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
