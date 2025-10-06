
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
    if (lastUnlocked) {
      setCurrentBadge(lastUnlocked);
      setVisible(true);

      const timer = setTimeout(() => {
        setVisible(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [lastUnlocked]);

  const handleClose = () => {
    setVisible(false);
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
        <div className="w-full max-w-sm bg-gray-800/80 backdrop-blur-md shadow-2xl rounded-xl pointer-events-auto ring-1 ring-cyan-500/50 overflow-hidden">
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Icon className="w-16 h-16" />
              </div>
              <div className="ml-4 flex-1 pt-0.5">
                <p className="text-sm font-semibold text-cyan-300 flex items-center">
                    <TrophyIcon className="w-4 h-4 mr-1.5" />
                    Achievement Unlocked!
                </p>
                <p className="mt-1 text-lg font-bold text-white">{currentBadge.title}</p>
                <p className="mt-1 text-sm text-gray-400">{currentBadge.description}</p>
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  onClick={handleClose}
                  className="inline-flex text-gray-400 rounded-md hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500"
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
