import React, { useState, useMemo } from 'react';
import { Module, Lesson, AppView } from '../types';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { TrophyIcon } from './icons/TrophyIcon';
import { EyeIcon } from './icons/EyeIcon';
import { ClockIcon } from './icons/ClockIcon';
import { PencilSquareIcon } from './icons/PencilSquareIcon';
import { RocketLaunchIcon } from './icons/RocketLaunchIcon';
import { BookmarkSquareIcon } from './icons/BookmarkSquareIcon';
import { MedalIcon } from './icons/MedalIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ChatBubbleLeftRightIcon } from './icons/ChatBubbleLeftRightIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { SignalIcon } from './icons/SignalIcon';
import { NewspaperIcon } from './icons/NewspaperIcon';
import { MagnifyingGlassChartIcon } from './icons/MagnifyingGlassChartIcon';
import { CalendarDaysIcon } from './icons/CalendarDaysIcon';
import { BeakerIcon } from './icons/BeakerIcon';
import { MagnifyingGlassIcon } from './icons/MagnifyingGlassIcon';
import { PlayIcon } from './icons/PlayIcon';
import { useApiKey } from '../hooks/useApiKey';
import { KeyIcon } from './icons/KeyIcon';
import { Cog6ToothIcon } from './icons/Cog6ToothIcon';

interface SidebarProps {
  modules: Module[];
  onSelectLesson: (lesson: Lesson) => void;
  selectedLessonKey?: string;
  currentView: AppView;
  onSetPracticeView: (view: AppView) => void;
  completedLessons: Set<string>;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ modules, onSelectLesson, selectedLessonKey, currentView, onSetPracticeView, completedLessons, isOpen, onClose }) => {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(modules.length > 0 ? [modules[0].title] : []));
  const [searchQuery, setSearchQuery] = useState('');
  const { openKeyModal } = useApiKey();

  const allLessons = useMemo(() => modules.flatMap(module => module.lessons.map(lesson => ({ ...lesson, moduleTitle: module.title }))), [modules]);

  const filteredLessons = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }
    return allLessons.filter(lesson =>
      lesson.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, allLessons]);
  
  const handleSearchResultClick = (lesson: Lesson) => {
    onSelectLesson(lesson);
    setSearchQuery(''); // Clear search after selection
  };

  const toggleModule = (title: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(title)) {
        newSet.delete(title);
      } else {
        newSet.add(title);
      }
      return newSet;
    });
  };

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-gray-800 p-6 flex flex-col overflow-y-auto border-r border-gray-700 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <h2 className="text-lg font-bold text-white">Learning Path</h2>
        <button onClick={onClose} className="p-1 text-gray-400 rounded-full hover:bg-gray-700 hover:text-white md:hidden" aria-label="Close sidebar">
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>

      <div className="relative mb-4 flex-shrink-0">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search lessons..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-gray-900/70 border border-gray-600 rounded-md py-2 pl-10 pr-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
        />
      </div>

      <div className="flex-grow overflow-y-auto -mr-3 pr-3">
        {searchQuery.trim() ? (
          <div className="space-y-1">
            <h3 className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase">Search Results</h3>
            {filteredLessons.length > 0 ? (
                <ul>
                    {filteredLessons.map(lesson => (
                        <li key={lesson.key}>
                            <button
                                onClick={() => handleSearchResultClick(lesson)}
                                className={`w-full text-left flex flex-col px-3 py-2 rounded-md transition-colors duration-150 text-gray-300 hover:bg-gray-700 hover:text-white`}
                            >
                                <span className="text-sm">{lesson.title}</span>
                                <span className="text-xs text-gray-500">{ (lesson as any).moduleTitle }</span>
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-center text-gray-500 text-sm p-4">No lessons found.</p>
            )}
        </div>
        ) : (
          <>
            <nav className="space-y-1">
              {modules.map((module, index) => {
                const isExpanded = expandedModules.has(module.title);
                return (
                  <div key={index}>
                    <button
                      onClick={() => toggleModule(module.title)}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-gray-400 uppercase tracking-wider hover:bg-gray-700/50 rounded-md transition-colors"
                      aria-expanded={isExpanded}
                    >
                      <span className="flex items-center">
                        <BookOpenIcon className="w-5 h-5 mr-2" />
                        {module.title}
                      </span>
                      <ChevronDownIcon className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-96' : 'max-h-0'}`}>
                      <ul className="space-y-1 pt-2 pl-4">
                        {module.lessons.map((lesson) => {
                          const isSelected = selectedLessonKey === lesson.key && currentView === 'lesson';
                          const isCompleted = completedLessons.has(lesson.key);
                          return (
                            <li key={lesson.key}>
                              <button
                                onClick={() => onSelectLesson(lesson)}
                                className={`w-full text-left flex items-center px-3 py-2 text-sm rounded-md transition-colors duration-150 ${
                                  isSelected
                                    ? 'bg-cyan-500/10 text-cyan-300 font-semibold'
                                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                }`}
                              >
                                <CheckCircleIcon className={`w-4 h-4 mr-3 flex-shrink-0 ${
                                  isSelected || isCompleted ? 'text-cyan-400' : 'text-gray-500'
                                }`} />
                                <span>{lesson.title}</span>
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  </div>
                )
              })}
            </nav>

            <div className="mt-8 pt-6 border-t border-gray-700">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center">
                  <SparklesIcon className="w-5 h-5 mr-2" />
                  AI Tools
              </h2>
              <ul className="space-y-2">
                  <li>
                      <button
                          onClick={() => onSetPracticeView('mentor')}
                          className={`w-full text-left flex items-center px-3 py-2 text-sm rounded-md transition-colors duration-150 ${
                            currentView === 'mentor'
                              ? 'bg-cyan-500/10 text-cyan-300 font-semibold'
                              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                          }`}
                        >
                          <ChatBubbleLeftRightIcon className={`w-4 h-4 mr-3 flex-shrink-0 ${
                            currentView === 'mentor' ? 'text-cyan-400' : 'text-gray-500'
                          }`} />
                          <span>AI Mentor</span>
                      </button>
                  </li>
                  <li>
                      <button
                          onClick={() => onSetPracticeView('market_analyzer')}
                          className={`w-full text-left flex items-center px-3 py-2 text-sm rounded-md transition-colors duration-150 ${
                            currentView === 'market_analyzer'
                              ? 'bg-cyan-500/10 text-cyan-300 font-semibold'
                              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                          }`}
                        >
                          <MagnifyingGlassChartIcon className={`w-4 h-4 mr-3 flex-shrink-0 ${
                            currentView === 'market_analyzer' ? 'text-cyan-400' : 'text-gray-500'
                          }`} />
                          <span>Market Analyzer</span>
                      </button>
                  </li>
                  <li>
                      <button
                          onClick={() => onSetPracticeView('economic_calendar')}
                          className={`w-full text-left flex items-center px-3 py-2 text-sm rounded-md transition-colors duration-150 ${
                            currentView === 'economic_calendar'
                              ? 'bg-cyan-500/10 text-cyan-300 font-semibold'
                              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                          }`}
                        >
                          <CalendarDaysIcon className={`w-4 h-4 mr-3 flex-shrink-0 ${
                            currentView === 'economic_calendar' ? 'text-cyan-400' : 'text-gray-500'
                          }`} />
                          <span>AI Calendar</span>
                      </button>
                  </li>
                  <li>
                      <button
                          onClick={() => onSetPracticeView('market_pulse')}
                          className={`w-full text-left flex items-center px-3 py-2 text-sm rounded-md transition-colors duration-150 ${
                            currentView === 'market_pulse'
                              ? 'bg-cyan-500/10 text-cyan-300 font-semibold'
                              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                          }`}
                        >
                          <SignalIcon className={`w-4 h-4 mr-3 flex-shrink-0 ${
                            currentView === 'market_pulse' ? 'text-cyan-400' : 'text-gray-500'
                          }`} />
                          <span>Market Pulse</span>
                      </button>
                  </li>
                  <li>
                      <button
                          onClick={() => onSetPracticeView('news_feed')}
                          className={`w-full text-left flex items-center px-3 py-2 text-sm rounded-md transition-colors duration-150 ${
                            currentView === 'news_feed'
                              ? 'bg-cyan-500/10 text-cyan-300 font-semibold'
                              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                          }`}
                        >
                          <NewspaperIcon className={`w-4 h-4 mr-3 flex-shrink-0 ${
                            currentView === 'news_feed' ? 'text-cyan-400' : 'text-gray-500'
                          }`} />
                          <span>News Feed</span>
                      </button>
                  </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-700">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center">
                  <TrophyIcon className="w-5 h-5 mr-2" />
                  Practice Modes
              </h2>
              <ul className="space-y-2">
                  <li>
                      <button
                          onClick={() => onSetPracticeView('pattern')}
                          className={`w-full text-left flex items-center px-3 py-2 text-sm rounded-md transition-colors duration-150 ${
                            currentView === 'pattern'
                              ? 'bg-cyan-500/10 text-cyan-300 font-semibold'
                              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                          }`}
                        >
                          <EyeIcon className={`w-4 h-4 mr-3 flex-shrink-0 ${
                            currentView === 'pattern' ? 'text-cyan-400' : 'text-gray-500'
                          }`} />
                          <span>Pattern Recognition</span>
                      </button>
                  </li>
                  <li>
                      <button
                          onClick={() => onSetPracticeView('timed')}
                          className={`w-full text-left flex items-center px-3 py-2 text-sm rounded-md transition-colors duration-150 ${
                            currentView === 'timed'
                              ? 'bg-cyan-500/10 text-cyan-300 font-semibold'
                              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                          }`}
                        >
                          <ClockIcon className={`w-4 h-4 mr-3 flex-shrink-0 ${
                            currentView === 'timed' ? 'text-cyan-400' : 'text-gray-500'
                          }`} />
                          <span>Timed Challenges</span>
                      </button>
                  </li>
                  <li>
                      <button
                          onClick={() => onSetPracticeView('canvas')}
                          className={`w-full text-left flex items-center px-3 py-2 text-sm rounded-md transition-colors duration-150 ${
                            currentView === 'canvas'
                              ? 'bg-cyan-500/10 text-cyan-300 font-semibold'
                              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                          }`}
                        >
                          <PencilSquareIcon className={`w-4 h-4 mr-3 flex-shrink-0 ${
                            currentView === 'canvas' ? 'text-cyan-400' : 'text-gray-500'
                          }`} />
                          <span>Free Practice Canvas</span>
                      </button>
                  </li>
                  <li>
                      <button
                          onClick={() => onSetPracticeView('simulator')}
                          className={`w-full text-left flex items-center px-3 py-2 text-sm rounded-md transition-colors duration-150 ${
                            currentView === 'simulator'
                              ? 'bg-cyan-500/10 text-cyan-300 font-semibold'
                              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                          }`}
                        >
                          <RocketLaunchIcon className={`w-4 h-4 mr-3 flex-shrink-0 ${
                            currentView === 'simulator' ? 'text-cyan-400' : 'text-gray-500'
                          }`} />
                          <span>Trade Simulator</span>
                      </button>
                  </li>
                  <li>
                      <button
                          onClick={() => onSetPracticeView('live_simulator')}
                          className={`w-full text-left flex items-center px-3 py-2 text-sm rounded-md transition-colors duration-150 ${
                            currentView === 'live_simulator'
                              ? 'bg-cyan-500/10 text-cyan-300 font-semibold'
                              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                          }`}
                        >
                          <PlayIcon className={`w-4 h-4 mr-3 flex-shrink-0 ${
                            currentView === 'live_simulator' ? 'text-cyan-400' : 'text-gray-500'
                          }`} />
                          <span>Live Chart Simulation</span>
                      </button>
                  </li>
                  <li>
                      <button
                          onClick={() => onSetPracticeView('backtester')}
                          className={`w-full text-left flex items-center px-3 py-2 text-sm rounded-md transition-colors duration-150 ${
                            currentView === 'backtester'
                              ? 'bg-cyan-500/10 text-cyan-300 font-semibold'
                              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                          }`}
                        >
                          <MagnifyingGlassChartIcon className={`w-4 h-4 mr-3 flex-shrink-0 ${
                            currentView === 'backtester' ? 'text-cyan-400' : 'text-gray-500'
                          }`} />
                          <span>AI Chart Analyst</span>
                      </button>
                  </li>
                  <li>
                      <button
                          onClick={() => onSetPracticeView('saved')}
                          className={`w-full text-left flex items-center px-3 py-2 text-sm rounded-md transition-colors duration-150 ${
                            currentView === 'saved'
                              ? 'bg-cyan-500/10 text-cyan-300 font-semibold'
                              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                          }`}
                        >
                          <BookmarkSquareIcon className={`w-4 h-4 mr-3 flex-shrink-0 ${
                            currentView === 'saved' ? 'text-cyan-400' : 'text-gray-500'
                          }`} />
                          <span>Saved Analysis</span>
                      </button>
                  </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-700">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center">
                  <MedalIcon className="w-5 h-5 mr-2" />
                  Progress & Settings
              </h2>
              <ul className="space-y-2">
                  <li>
                      <button
                          onClick={() => onSetPracticeView('achievements')}
                          className={`w-full text-left flex items-center px-3 py-2 text-sm rounded-md transition-colors duration-150 ${
                            currentView === 'achievements'
                              ? 'bg-cyan-500/10 text-cyan-300 font-semibold'
                              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                          }`}
                        >
                          <TrophyIcon className={`w-4 h-4 mr-3 flex-shrink-0 ${
                            currentView === 'achievements' ? 'text-cyan-400' : 'text-gray-500'
                          }`} />
                          <span>Achievements</span>
                      </button>
                  </li>
                  <li>
                      <button
                          onClick={() => onSetPracticeView('trading_plan')}
                          className={`w-full text-left flex items-center px-3 py-2 text-sm rounded-md transition-colors duration-150 ${
                            currentView === 'trading_plan'
                              ? 'bg-cyan-500/10 text-cyan-300 font-semibold'
                              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                          }`}
                        >
                          <DocumentTextIcon className={`w-4 h-4 mr-3 flex-shrink-0 ${
                            currentView === 'trading_plan' ? 'text-cyan-400' : 'text-gray-500'
                          }`} />
                          <span>My Trading Plan</span>
                      </button>
                  </li>
                  <li>
                      <button
                          onClick={() => onSetPracticeView('settings')}
                          className={`w-full text-left flex items-center px-3 py-2 text-sm rounded-md transition-colors duration-150 ${
                            currentView === 'settings'
                              ? 'bg-cyan-500/10 text-cyan-300 font-semibold'
                              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                          }`}
                        >
                          <Cog6ToothIcon className={`w-4 h-4 mr-3 flex-shrink-0 ${
                            currentView === 'settings' ? 'text-cyan-400' : 'text-gray-500'
                          }`} />
                          <span>Settings</span>
                      </button>
                  </li>
              </ul>
            </div>
          </>
        )}
      </div>
    </aside>
  );
};