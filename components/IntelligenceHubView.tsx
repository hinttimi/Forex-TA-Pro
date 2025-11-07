import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { AppView, Lesson, DailyMission, LearningPath } from '../types';
import { useCompletion } from '../hooks/useCompletion';
import { useBadges } from '../hooks/useBadges';
import { ALL_BADGES } from '../constants/badges';
import { LEARNING_PATHS } from '../constants';
import { SparklesIcon } from './icons/SparklesIcon';
import { TrophyIcon } from './icons/TrophyIcon';
import { ArrowRightIcon } from './icons/ArrowRightIcon';
import { BeakerIcon } from './icons/BeakerIcon';
import { FlagIcon } from './icons/FlagIcon';
import { generateDailyMission } from '../services/geminiService';
import { useApiKey } from '../hooks/useApiKey';
import { LoadingSpinner } from './LoadingSpinner';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { RocketLaunchIcon } from './icons/RocketLaunchIcon';
import { ClipboardDocumentListIcon } from './icons/ClipboardDocumentListIcon';
import { LockClosedIcon } from './icons/LockClosedIcon';
import { WeeklyMarketBriefing } from './WeeklyMarketBriefing';

interface IntelligenceHubViewProps {
  onSelectLesson: (lesson: Lesson) => void;
  onSetView: (view: AppView) => void;
}

const allLessons = LEARNING_PATHS.flatMap(p => p.modules.flatMap(m => m.lessons));
const foundationPath = LEARNING_PATHS.find(p => p.isFoundation);
const foundationLessons = foundationPath?.modules.flatMap(m => m.lessons) || [];

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const DailyMissionWidget: React.FC<{onSetView: (view: AppView) => void}> = ({ onSetView }) => {
    const { completedLessons, getCompletionCount, incrementCount } = useCompletion();
    const { apiKey } = useApiKey();

    const [dailyMission, setDailyMission] = useState<DailyMission | null>(null);
    const [isMissionLoading, setIsMissionLoading] = useState(false);
    const [missionError, setMissionError] = useState<string | null>(null);
    const [isMissionComplete, setIsMissionComplete] = useState(false);

    const missionKey = `dailyMission_${getTodayDateString()}`;

    useEffect(() => {
        const checkMissionCompletion = () => {
            const missionDataStr = localStorage.getItem(missionKey);
            if (missionDataStr) {
                const data = JSON.parse(missionDataStr);
                setDailyMission(data.mission);
                
                const initialCount = data.initialCount;
                const currentCount = getCompletionCount(data.mission.completion_criteria as any);

                if (data.isComplete || currentCount > initialCount) {
                     setIsMissionComplete(true);
                     if (!data.isComplete) {
                        localStorage.setItem(missionKey, JSON.stringify({ ...data, isComplete: true }));
                     }
                }
            }
        };
        checkMissionCompletion();
        // Check completion every time the view changes, in case a mission was completed
    }, [getCompletionCount, missionKey, onSetView]);

    const handleGenerateMission = useCallback(async () => {
        if (!apiKey) {
          setMissionError("API key is required to generate a mission.");
          return;
        }
        setIsMissionLoading(true);
        setMissionError(null);
        try {
          const completedLessonTitles = allLessons
            .filter(l => completedLessons.has(l.key))
            .map(l => l.title);
            
          const mission = await generateDailyMission(apiKey, completedLessonTitles);
          setDailyMission(mission);
          setIsMissionComplete(false);

          const initialCount = getCompletionCount(mission.completion_criteria as any);
          localStorage.setItem(missionKey, JSON.stringify({ mission, initialCount, isComplete: false }));

        } catch (e) {
          console.error(e);
          setMissionError("Could not generate a mission. Please try again.");
        } finally {
          setIsMissionLoading(false);
        }
    }, [apiKey, completedLessons, getCompletionCount, missionKey]);

    return (
         <div className="p-6 bg-[--color-dark-matter] border border-[--color-border] rounded-xl shadow-sm">
            <h3 className="text-lg font-bold text-[--color-ghost-white] mb-4 flex items-center">
              <FlagIcon className="w-6 h-6 mr-2 text-cyan-400"/>
              Daily Mission
            </h3>
            { isMissionLoading ? <div className="text-center py-4"><LoadingSpinner /></div> :
              isMissionComplete ? (
                <div className="text-center py-4 text-green-400">
                    <CheckCircleIcon className="w-10 h-10 mx-auto" />
                    <p className="font-semibold mt-2">Mission Accomplished!</p>
                </div>
              ) : missionError ? (
                <div className="text-center py-4 text-red-400">
                    <p className="text-sm">{missionError}</p>
                    <button onClick={handleGenerateMission} className="text-xs underline mt-2">Try Again</button>
                </div>
              ) : dailyMission ? (
                <div>
                    <p className="font-semibold text-white">{dailyMission.title}</p>
                    <p className="text-sm text-[--color-muted-grey] mt-1">{dailyMission.description}</p>
                    <button onClick={() => onSetView(dailyMission.tool)} className="mt-4 w-full text-sm py-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-semibold rounded-lg hover:bg-cyan-500/20 transition-colors">
                        Go to {dailyMission.tool.replace(/_/g, ' ')}
                    </button>
                </div>
              ) : (
                <div>
                    <p className="text-sm text-[--color-muted-grey]">Get a personalized task to practice your skills.</p>
                     <button onClick={handleGenerateMission} className="mt-4 w-full text-sm py-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-semibold rounded-lg hover:bg-cyan-500/20 transition-colors">
                        Generate Mission
                    </button>
                </div>
              )
            }
        </div>
    )
}

const LearningPathCard: React.FC<{ path: LearningPath; completedLessons: Set<string>, isLocked: boolean }> = ({ path, completedLessons, isLocked }) => {
    const totalLessons = path.modules.flatMap(m => m.lessons).length;
    const completedInPath = path.modules.flatMap(m => m.lessons).filter(l => completedLessons.has(l.key)).length;
    const progress = totalLessons > 0 ? (completedInPath / totalLessons) * 100 : 0;
    
    return (
        <div className="relative bg-[--color-dark-matter] border border-[--color-border] rounded-xl shadow-sm p-6 overflow-hidden">
            {isLocked && <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-10"><LockClosedIcon className="w-10 h-10 text-slate-500 mb-2" /><p className="text-slate-400 font-semibold">Complete Foundation</p></div>}
            <h3 className="text-xl font-bold text-white">{path.title}</h3>
            <p className="text-sm text-[--color-muted-grey] mt-1 h-10">{path.description}</p>
            {totalLessons > 0 && (
                 <div className="mt-4">
                    <div className="flex justify-between text-xs text-[--color-muted-grey] mb-1">
                        <span>Progress</span>
                        <span>{completedInPath}/{totalLessons}</span>
                    </div>
                    <div className="w-full bg-[--color-obsidian-slate] rounded-full h-2">
                        <div className="bg-[--color-focus-gold] h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
            )}
        </div>
    )
}


export const IntelligenceHubView: React.FC<IntelligenceHubViewProps> = ({ onSelectLesson, onSetView }) => {
  const { completedLessons, getCompletionCount } = useCompletion();
  const { unlockedIds } = useBadges();

  const nextLesson = useMemo(() => {
    return allLessons.find(lesson => !completedLessons.has(lesson.key)) || allLessons[0];
  }, [completedLessons]);

  const foundationComplete = useMemo(() => {
    return foundationLessons.every(l => completedLessons.has(l.key));
  }, [completedLessons]);

  const progressPercentage = (completedLessons.size / allLessons.length) * 100;
  
  const UpNextCard = () => {
    const currentModule = LEARNING_PATHS.flatMap(p => p.modules).find(m => m.lessons.some(l => l.key === nextLesson.key));
    const lessonsInModule = currentModule?.lessons || [];
    const completedInModule = lessonsInModule.filter(l => completedLessons.has(l.key)).length;
    const moduleProgress = lessonsInModule.length > 0 ? (completedInModule / lessonsInModule.length) * 100 : 0;

    return (
         <div className="bg-[--color-dark-matter] border border-[--color-border] rounded-xl shadow-lg transition-all duration-300 p-8">
            <h2 className="text-sm font-semibold text-[--color-neural-blue] uppercase tracking-wider">{completedLessons.size === 0 ? "Start Your Journey" : "Up Next"}</h2>
            <p className="mt-2 text-3xl font-bold text-white">{nextLesson.title}</p>
            {currentModule && <p className="text-sm text-[--color-muted-grey] mt-1">From: {currentModule.title}</p>}
            
            {currentModule && (
                 <div className="mt-4">
                    <div className="flex justify-between text-xs text-[--color-muted-grey] mb-1">
                        <span>Module Progress</span>
                        <span>{completedInModule}/{lessonsInModule.length}</span>
                    </div>
                    <div className="w-full bg-[--color-obsidian-slate] rounded-full h-1.5">
                        <div className="bg-[--color-neural-blue] h-1.5 rounded-full" style={{ width: `${moduleProgress}%` }}></div>
                    </div>
                </div>
            )}

            <button 
                onClick={() => onSelectLesson(nextLesson)}
                className="mt-6 inline-flex items-center px-6 py-3 bg-[--color-neural-blue] text-slate-900 font-bold rounded-lg shadow-md hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[--color-dark-matter] focus:ring-sky-500 transition-all duration-200 hover:scale-105">
                {completedLessons.size === 0 ? "Start First Lesson" : "Continue Lesson"}
                <ArrowRightIcon className="w-5 h-5 ml-2" />
            </button>
        </div>
    )
  }

  return (
    <div className="animate-fade-in-up">
      <h1 className="text-4xl font-extrabold text-white tracking-tight">Intelligence Hub</h1>
      <p className="mt-1 text-lg text-[--color-muted-grey]">Your mission control for navigating the markets with an AI edge.</p>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          <UpNextCard />

          <WeeklyMarketBriefing />
          
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Learning Paths</h2>
            <div className="space-y-4">
                {foundationPath && <LearningPathCard path={foundationPath} completedLessons={completedLessons} isLocked={false} />}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {LEARNING_PATHS.filter(p => !p.isFoundation).map(path => (
                        <LearningPathCard key={path.id} path={path} completedLessons={completedLessons} isLocked={!foundationComplete} />
                    ))}
                </div>
            </div>
          </div>
        </div>

        {/* Side Column */}
        <div className="space-y-6">
            <DailyMissionWidget onSetView={onSetView} />

             <div className="p-6 bg-[--color-dark-matter] border border-[--color-border] rounded-xl shadow-sm">
                 <h3 className="text-lg font-bold text-[--color-ghost-white] mb-4">At a Glance</h3>
                 <div className="space-y-4">
                    <div>
                        <div className="flex justify-between text-sm text-[--color-muted-grey] mb-1"><span>Overall Completion</span><span>{Math.floor(progressPercentage)}%</span></div>
                         <div className="w-full bg-[--color-obsidian-slate] rounded-full h-2"><div className="bg-[--color-focus-gold] h-2 rounded-full" style={{ width: `${progressPercentage}%` }}></div></div>
                    </div>
                     <div className="flex justify-between items-center text-sm"><span className="text-[--color-muted-grey]">Badges Unlocked</span><span className="font-semibold text-white">{unlockedIds.size} / {ALL_BADGES.length}</span></div>
                     <div className="flex justify-between items-center text-sm"><span className="text-[--color-muted-grey]">Simulator Trades</span><span className="font-semibold text-white">{getCompletionCount('simulatorRuns')}</span></div>
                 </div>
            </div>

            <div className="p-6 bg-[--color-dark-matter] border border-[--color-border] rounded-xl shadow-sm">
                 <h3 className="text-lg font-bold text-[--color-ghost-white] mb-4">Quick Access</h3>
                 <div className="space-y-2">
                    <button onClick={() => onSetView('mentor')} className="w-full flex items-center p-3 rounded-lg hover:bg-[--color-obsidian-slate] transition-colors"><SparklesIcon className="w-6 h-6 mr-3 text-[--color-neural-blue]" /><span className="font-semibold text-white">AI Mentor</span></button>
                    <button onClick={() => onSetView('live_simulator')} className="w-full flex items-center p-3 rounded-lg hover:bg-[--color-obsidian-slate] transition-colors"><RocketLaunchIcon className="w-6 h-6 mr-3 text-[--color-neural-blue]" /><span className="font-semibold text-white">Live Chart Simulator</span></button>
                    <button onClick={() => onSetView('trading_journal')} className="w-full flex items-center p-3 rounded-lg hover:bg-[--color-obsidian-slate] transition-colors"><ClipboardDocumentListIcon className="w-6 h-6 mr-3 text-[--color-neural-blue]" /><span className="font-semibold text-white">Trading Journal</span></button>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};