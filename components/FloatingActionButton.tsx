import React from 'react';
import { SparklesIcon } from './icons/SparklesIcon';
import { AppView } from '../types';

interface FloatingActionButtonProps {
    onSetView: (view: AppView) => void;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onSetView }) => {
    return (
        <button
            onClick={() => onSetView('mentor')}
            className="fixed bottom-20 right-4 z-20 md:hidden w-14 h-14 bg-blue-600 text-white dark:bg-cyan-500 dark:text-slate-900 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 dark:hover:bg-cyan-400 transition-all duration-300 transform hover:scale-110 active:scale-100"
            aria-label="Open AI Mentor"
        >
            <SparklesIcon className="w-8 h-8" />
        </button>
    );
};