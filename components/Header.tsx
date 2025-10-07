
import React from 'react';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { Bars3Icon } from './icons/Bars3Icon';

interface HeaderProps {
  onToggleSidebar: () => void;
  onNextLesson: () => void;
  onPreviousLesson: () => void;
  hasNextLesson: boolean;
  hasPreviousLesson: boolean;
  currentLessonTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ 
  onToggleSidebar,
  onNextLesson, 
  onPreviousLesson, 
  hasNextLesson, 
  hasPreviousLesson,
  currentLessonTitle 
}) => {
  return (
    <header className="flex-shrink-0 bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 px-4 sm:px-6 lg:px-10 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-3 overflow-hidden">
         <button 
          onClick={onToggleSidebar} 
          className="p-1.5 text-gray-400 rounded-md hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          aria-label="Toggle sidebar"
         >
            <Bars3Icon className="w-6 h-6" />
        </button>
        <ChartBarIcon className="w-8 h-8 text-cyan-400 flex-shrink-0" />
        <h1 className="text-2xl font-bold tracking-tight text-white truncate hidden sm:block">Forex TA Pro</h1>
        <span className="bg-cyan-400/10 text-cyan-400 text-xs font-semibold px-2 py-1 rounded-full hidden sm:block">AI Mentor</span>
        {currentLessonTitle && (
            <div className="hidden lg:flex items-center overflow-hidden">
                <span className="mx-4 text-gray-600">|</span>
                <span className="text-sm text-gray-400 truncate">Now Learning: <span className="font-semibold text-gray-200">{currentLessonTitle}</span></span>
            </div>
        )}
      </div>
      
      <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
        <button
            onClick={onPreviousLesson}
            disabled={!hasPreviousLesson}
            className="inline-flex items-center p-2 bg-gray-700/50 text-gray-200 font-semibold rounded-lg shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-200"
            aria-label="Previous Lesson"
        >
            <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <button
            onClick={onNextLesson}
            disabled={!hasNextLesson}
            className="inline-flex items-center p-2 bg-cyan-500 text-gray-900 font-semibold rounded-lg shadow-sm hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200"
            aria-label="Next Lesson"
        >
            <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
};
