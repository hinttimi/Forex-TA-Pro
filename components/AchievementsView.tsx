

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
          ? 'bg-slate-800/50 border-cyan-500/30 shadow-lg shadow-cyan-900/20'
          : 'bg-slate-800/20 border-slate-700/50'
        }
      `}
    >
      <div className="flex items-center space-x-5">
        <div className={`transition-opacity duration-500 ${!isUnlocked && 'opacity-30 grayscale'}`}>
          <Icon className="w-20 h-20" />
        </div>
        <div className="flex-1">
          <h3 className={`text-xl font-bold transition-colors ${isUnlocked ? 'text-white' : 'text-slate-500'}`}>
            {badge.title}
          </h3>
          <p className={`mt-1 text-sm ${isUnlocked ? 'text-slate-300' : 'text-slate-600'}`}>
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
      <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">Achievements</h1>
      <p className="text-slate-400 mb-8">Track your progress and celebrate your milestones as a trader.</p>
      
      <div className="mb-8 p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-cyan-300">Progress</span>
            <span className="text-sm font-mono text-slate-400">{unlockedCount} / {totalCount} Unlocked</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2.5">
            <div 
                className="bg-cyan-500 h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${(unlockedCount / totalCount) * 100}%` }}>
            </div>
          </div>
      </div>
        {unlockedCount === 0 ? (
             <div className="text-center py-20 bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-xl">
                <TrophyIcon className="w-16 h-16 mx-auto text-slate-500 mb-4" />
                <h2 className="text-2xl font-bold text-white">Your Trophy Case is Empty</h2>
                <p className="text-slate-400 mt-2 max-w-md mx-auto">Start completing lessons and practicing in the simulator to earn your first badge!</p>
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