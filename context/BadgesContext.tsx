import React, { createContext, useState, useCallback, useEffect, ReactNode, useMemo } from 'react';
import { Badge } from '../types';
import { ALL_BADGES } from '../constants/badges';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';


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
  const { currentUser } = useAuth();
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [lastUnlocked, setLastUnlocked] = useState<Badge | null>(null);

  useEffect(() => {
    const fetchBadges = async () => {
        if (currentUser) {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
                setUnlockedIds(new Set(docSnap.data().unlockedBadges || []));
            }
        } else {
            setUnlockedIds(new Set());
        }
    };
    fetchBadges();
  }, [currentUser]);

  const unlockBadge = useCallback(async (id: string) => {
    if (!currentUser || unlockedIds.has(id)) return;

    const newIds = new Set(unlockedIds);
    newIds.add(id);
    setUnlockedIds(newIds);
    
    const userDocRef = doc(db, 'users', currentUser.uid);
    try {
        await updateDoc(userDocRef, {
            unlockedBadges: arrayUnion(id)
        });

        const badgeInfo = ALL_BADGES.find(b => b.id === id);
        if (badgeInfo) {
          setLastUnlocked(badgeInfo);
        }
    } catch (error) {
        console.error("Failed to save unlocked badge to Firestore:", error);
    }
  }, [currentUser, unlockedIds]);

  const value = useMemo(() => ({
    unlockedIds,
    unlockBadge,
    lastUnlocked
  }), [unlockedIds, lastUnlocked, unlockBadge]);

  return (
    <BadgesContext.Provider value={value}>
      {children}
    </BadgesContext.Provider>
  );
};