
import React from 'react';
import { useBadges } from '../hooks/useBadges';
import { ALL_BADGES } from '../constants/badges';
import { Badge } from '../types';

const BadgeCard: React.FC<{ badge: Badge; isUnlocked: boolean }> = ({ badge, isUnlocked }) => {
  const { icon: Icon } = badge;
  return (
    <div
      className={`
        p-6 rounded-xl border-2 transition-all duration-300 ease-in-out
        ${isUnlocked
          ? 'bg-gray-800/50 border-cyan-500/30 shadow-lg shadow-cyan-900/20'
          : 'bg-gray-800/20 border-gray-700/50'
        }
      `}
    >
      <div className="flex items-center space-x-5">
        <div className={`transition-opacity duration-500 ${!isUnlocked && 'opacity-30 grayscale'}`}>
          <Icon className="w-20 h-20" />
        </div>
        <div className="flex-1">
          <h3 className={`text-xl font-bold transition-colors ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>
            {badge.title}
          </h3>
          <p className={`mt-1 text-sm ${isUnlocked ? 'text-gray-300' : 'text-gray-600'}`}>
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
      <p className="text-gray-400 mb-8">Track your progress and celebrate your milestones as a trader.</p>
      
      <div className="mb-8 p-4 bg-gray-800/30 border border-gray-700 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-cyan-300">Progress</span>
            <span className="text-sm font-mono text-gray-400">{unlockedCount} / {totalCount} Unlocked</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div 
                className="bg-cyan-500 h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${(unlockedCount / totalCount) * 100}%` }}>
            </div>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {ALL_BADGES.map(badge => (
          <BadgeCard key={badge.id} badge={badge} isUnlocked={unlockedIds.has(badge.id)} />
        ))}
      </div>
    </div>
  );
};
