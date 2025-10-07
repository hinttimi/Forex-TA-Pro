
import React from 'react';
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

interface SidebarProps {
  modules: Module[];
  onSelectLesson: (lesson: Lesson) => void;
  selectedLessonKey?: string;
  currentView: AppView;
  onSetPracticeView: (view: AppView) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ modules, onSelectLesson, selectedLessonKey, currentView, onSetPracticeView }) => {
  return (
    <aside className="w-72 flex-shrink-0 bg-gray-800 p-6 overflow-y-auto border-r border-gray-700 hidden md:block">
      <nav className="space-y-6">
        {modules.map((module, index) => (
          <div key={index}>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center">
              <BookOpenIcon className="w-5 h-5 mr-2" />
              {module.title}
            </h2>
            <ul className="space-y-2">
              {module.lessons.map((lesson) => (
                <li key={lesson.key}>
                  <button
                    onClick={() => onSelectLesson(lesson)}
                    className={`w-full text-left flex items-center px-3 py-2 text-sm rounded-md transition-colors duration-150 ${
                      selectedLessonKey === lesson.key && currentView === 'lesson'
                        ? 'bg-cyan-500/10 text-cyan-300 font-semibold'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <CheckCircleIcon className={`w-4 h-4 mr-3 flex-shrink-0 ${
                       selectedLessonKey === lesson.key && currentView === 'lesson' ? 'text-cyan-400' : 'text-gray-500'
                    }`} />
                    <span>{lesson.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
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
            Progress
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
        </ul>
      </div>
    </aside>
  );
};