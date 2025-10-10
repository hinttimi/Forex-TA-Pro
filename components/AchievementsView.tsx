

import React from 'react';
import { useBadges } from '../hooks/useBadges';
import { ALL_BADGES } from '../constants/badges';
import { Badge } from '../types';
import { TrophyIcon } from './icons/TrophyIcon';

const BadgeCard: React.FC<{ badge: Badge; isUnlocked: boolean }> = ({ badge, isUnlocked }) => {
  const { icon: Icon } = badge;
  return (
    <div
      className={`
        p-6 rounded-xl border-2 transition-all duration-300 ease-in-out
        ${isUnlocked
          ? 'bg-[--color-dark-matter]/50 border-[--color-focus-gold]/30 shadow-lg shadow-[--color-focus-gold]/10'
          : 'bg-[--color-dark-matter]/20 border-[--color-border]/50'
        }
      `}
    >
      <div className="flex items-center space-x-5">
        <div className={`transition-opacity duration-500 ${!isUnlocked && 'opacity-30 grayscale'}`}>
          <Icon className="w-20 h-20" />
        </div>
        <div className="flex-1">
          <h3 className={`text-xl font-bold transition-colors ${isUnlocked ? 'text-[--color-ghost-white]' : 'text-[--color-muted-grey]'}`}>
            {badge.title}
          </h3>
          <p className={`mt-1 text-sm ${isUnlocked ? 'text-[--color-ghost-white]/80' : 'text-[--color-muted-grey]/70'}`}>
            {badge.description}
          </p>
        </div>
      </div>
    </div>
  );
};

export const AchievementsView: React.FC = () => {
  const { unlockedIds } = useBadges();
  const unlockedCount = unlockedIds.size;
  const totalCount = ALL_BADGES.length;

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-4xl font-extrabold text-[--color-ghost-white] mb-2 tracking-tight">Achievements</h1>
      <p className="text-[--color-muted-grey] mb-8">Track your progress and celebrate your milestones as a trader.</p>
      
      <div className="mb-8 p-4 bg-[--color-dark-matter]/30 border border-[--color-border] rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-[--color-focus-gold]">Progress</span>
            <span className="text-sm font-mono text-[--color-muted-grey]">{unlockedCount} / {totalCount} Unlocked</span>
          </div>
          <div className="w-full bg-[--color-border] rounded-full h-2.5">
            <div 
                className="bg-[--color-focus-gold] h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${(unlockedCount / totalCount) * 100}%` }}>
            </div>
          </div>
      </div>
        {unlockedCount === 0 ? (
             <div className="text-center py-20 bg-[--color-dark-matter]/50 border-2 border-dashed border-[--color-border] rounded-xl">
                <TrophyIcon className="w-16 h-16 mx-auto text-[--color-muted-grey]/50 mb-4" />
                <h2 className="text-2xl font-bold text-[--color-ghost-white]">Your Trophy Case is Empty</h2>
                <p className="text-[--color-muted-grey] mt-2 max-w-md mx-auto">Start completing lessons and practicing in the simulator to earn your first badge!</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {ALL_BADGES.map(badge => (
                <BadgeCard key={badge.id} badge={badge} isUnlocked={unlockedIds.has(badge.id)} />
                ))}
            </div>
        )}
    </div>
  );
};
