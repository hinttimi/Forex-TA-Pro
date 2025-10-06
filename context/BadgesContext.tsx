
import React, { createContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Badge } from '../types';
import { ALL_BADGES } from '../constants/badges';

const BADGES_KEY = 'unlockedBadges';

interface BadgesContextType {
  unlockedIds: Set<string>;
  unlockBadge: (id: string) => void;
  lastUnlocked: Badge | null;
}

export const BadgesContext = createContext<BadgesContextType>({
  unlockedIds: new Set(),
  unlockBadge: () => {},
  lastUnlocked: null,
});

export const BadgesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [lastUnlocked, setLastUnlocked] = useState<Badge | null>(null);

  useEffect(() => {
    try {
      const storedBadges = localStorage.getItem(BADGES_KEY);
      if (storedBadges) {
        setUnlockedIds(new Set(JSON.parse(storedBadges)));
      }
    } catch (error) {
      console.error("Failed to load unlocked badges from localStorage:", error);
    }
  }, []);

  const unlockBadge = useCallback((id: string) => {
    setUnlockedIds(prevIds => {
      if (!prevIds.has(id)) {
        const newIds = new Set(prevIds);
        newIds.add(id);
        
        try {
          localStorage.setItem(BADGES_KEY, JSON.stringify(Array.from(newIds)));
        } catch (error) {
          console.error("Failed to save unlocked badges to localStorage:", error);
        }

        const badgeInfo = ALL_BADGES.find(b => b.id === id);
        if (badgeInfo) {
          setLastUnlocked(badgeInfo);
        }

        return newIds;
      }
      return prevIds;
    });
  }, []);

  return (
    <BadgesContext.Provider value={{ unlockedIds, unlockBadge, lastUnlocked }}>
      {children}
    </BadgesContext.Provider>
  );
};
