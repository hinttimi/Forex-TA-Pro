import React, { useMemo } from 'react';
import { AppView, Lesson } from '../types';
import { useCompletion } from '../hooks/useCompletion';
import { useBadges } from '../hooks/useBadges';
import { ALL_BADGES } from '../constants/badges';
import { MODULES } from '../constants';
import { SparklesIcon } from './icons/SparklesIcon';
import { TrophyIcon } from './icons/TrophyIcon';
import { RocketLaunchIcon } from './icons/RocketLaunchIcon';
import { ArrowRightIcon } from './icons/ArrowRightIcon';

interface DashboardViewProps {
  onSelectLesson: (lesson: Lesson) => void;
  onSetView: (view: AppView) => void;
}

const allLessons = MODULES.flatMap(m => m.lessons);

export const DashboardView: React.FC<DashboardViewProps> = ({ onSelectLesson, onSetView }) => {
  const { getCompletedLessons } = useCompletion();
  const { unlockedIds } = useBadges();
  const completedLessons = getCompletedLessons();

  const nextLesson = useMemo(() => {
    return allLessons.find(lesson => !completedLessons.has(lesson.key)) || allLessons[0];
  }, [completedLessons]);

  const recentBadges = useMemo(() => {
    return [...ALL_BADGES].reverse().filter(b => unlockedIds.has(b.id)).slice(0, 3);
  }, [unlockedIds]);

  const progressPercentage = (completedLessons.size / allLessons.length) * 100;

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-4xl font-extrabold text-white tracking-tight">Welcome Back!</h1>
      <p className="mt-2 text-lg text-slate-400">Let's continue your journey to trading mastery.</p>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Panel */}
        <div className="lg:col-span-2 space-y-8">
          {/* Continue Learning */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:border-slate-600 hover:shadow-cyan-500/10">
            <div className="p-6">
              <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">Continue Learning</h2>
              <p className="mt-2 text-2xl font-bold text-white">{nextLesson.title}</p>
              <button 
                onClick={() => onSelectLesson(nextLesson)}
                className="mt-4 inline-flex items-center px-5 py-2.5 bg-cyan-500 text-slate-900 font-bold rounded-lg shadow-md hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 transition-all duration-200">
                {completedLessons.size === 0 ? "Start First Lesson" : "Jump Back In"}
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button onClick={() => onSetView('mentor')} className="p-6 bg-slate-800/50 border border-slate-700 rounded-xl text-left hover:border-cyan-500/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300">
                <SparklesIcon className="w-8 h-8 text-cyan-400 mb-3" />
                <h3 className="text-lg font-bold text-white">AI Mentor</h3>
                <p className="text-sm text-slate-400">Ask questions or get chart feedback.</p>
            </button>
            <button onClick={() => onSetView('simulator')} className="p-6 bg-slate-800/50 border border-slate-700 rounded-xl text-left hover:border-cyan-500/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300">
                <RocketLaunchIcon className="w-8 h-8 text-cyan-400 mb-3" />
                <h3 className="text-lg font-bold text-white">Trade Simulator</h3>
                <p className="text-sm text-slate-400">Practice your setups in a risk-free environment.</p>
            </button>
          </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-8">
          {/* Progress */}
          <div className="p-6 bg-slate-800/50 border border-slate-700 rounded-xl">
             <h3 className="text-lg font-bold text-white mb-4">Your Progress</h3>
             <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-cyan-300">Overall Completion</span>
                <span className="text-sm font-mono text-slate-400">{completedLessons.size} / {allLessons.length}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2.5">
                <div 
                    className="bg-cyan-500 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${progressPercentage}%` }}>
                </div>
            </div>
          </div>
          {/* Recent Achievements */}
          <div className="p-6 bg-slate-800/50 border border-slate-700 rounded-xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center">
              <TrophyIcon className="w-6 h-6 mr-2 text-yellow-400"/>
              Recent Achievements
            </h3>
            {recentBadges.length > 0 ? (
                <div className="space-y-4">
                  {recentBadges.map(badge => (
                    <div key={badge.id} className="flex items-center">
                      <badge.icon className="w-12 h-12 flex-shrink-0" />
                      <div className="ml-3">
                        <p className="font-semibold text-sm text-slate-200">{badge.title}</p>
                        <p className="text-xs text-slate-400">{badge.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
            ) : (
                <p className="text-sm text-slate-500 italic">Complete lessons and challenges to earn badges!</p>
            )}
             <button onClick={() => onSetView('achievements')} className="w-full mt-4 text-sm text-center text-cyan-400 hover:underline">
                View All Achievements
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};