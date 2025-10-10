

import React, { useState, useEffect } from 'react';
import { useBadges } from '../hooks/useBadges';
import { Badge } from '../types';
import { XMarkIcon } from './icons/XMarkIcon';
import { TrophyIcon } from './icons/TrophyIcon';

export const BadgeNotification: React.FC = () => {
  const { lastUnlocked } = useBadges();
  const [visible, setVisible] = useState(false);
  const [currentBadge, setCurrentBadge] = useState<Badge | null>(null);

  useEffect(() => {
    let visibilityTimer: number;
    let cleanupTimer: number;

    if (lastUnlocked) {
      setCurrentBadge(lastUnlocked);
      setVisible(true);

      visibilityTimer = window.setTimeout(() => {
        setVisible(false);
        // After the fade-out transition, clear the badge so the component unmounts from the DOM.
        cleanupTimer = window.setTimeout(() => {
          setCurrentBadge(null);
        }, 500); // This duration must match the transition duration in the className
      }, 5000);
    }

    return () => {
      clearTimeout(visibilityTimer);
      clearTimeout(cleanupTimer);
    };
  }, [lastUnlocked]);

  const handleClose = () => {
    setVisible(false);
    // Set a timeout to clear the badge after the animation, ensuring the component unmounts.
    setTimeout(() => {
        setCurrentBadge(null);
    }, 500);
  };

  if (!currentBadge) {
    return null;
  }

  const { icon: Icon } = currentBadge;

  return (
    <>
      <div
        aria-live="assertive"
        className={`fixed inset-0 flex items-end justify-end px-4 py-6 pointer-events-none sm:p-6 z-50 transition-all duration-500 ease-in-out ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ transform: visible ? 'translateY(0)' : 'translateY(20px)' }}
      >
        <div className="w-full max-w-sm bg-[--color-dark-matter]/80 backdrop-blur-md shadow-2xl rounded-xl pointer-events-auto ring-1 ring-[--color-focus-gold]/50 overflow-hidden">
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Icon className="w-16 h-16" />
              </div>
              <div className="ml-4 flex-1 pt-0.5">
                <p className="text-sm font-semibold text-[--color-focus-gold] flex items-center">
                    <TrophyIcon className="w-4 h-4 mr-1.5" />
                    Achievement Unlocked!
                </p>
                <p className="mt-1 text-lg font-bold text-[--color-ghost-white]">{currentBadge.title}</p>
                <p className="mt-1 text-sm text-[--color-muted-grey]">{currentBadge.description}</p>
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
    </>
  );
};
