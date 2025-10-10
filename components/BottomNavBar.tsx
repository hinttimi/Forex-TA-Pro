import React from 'react';
import { AppView } from '../types';
import { HomeIcon } from './icons/HomeIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { ClipboardDocumentListIcon } from './icons/ClipboardDocumentListIcon';

interface BottomNavBarProps {
    currentView: AppView;
    onSetView: (view: AppView) => void;
    onSelectLesson: () => void;
}

const NavItem: React.FC<{
    view: AppView;
    label: string;
    icon: React.FC<{className?: string}>;
    isActive: boolean;
    onClick: () => void;
}> = ({ view, label, icon: Icon, isActive, onClick }) => {
    return (
        <button onClick={onClick} className="flex-1 flex flex-col items-center justify-center p-2 text-xs transition-colors duration-200 focus:outline-none focus:bg-[--color-dark-matter]/50">
            <Icon className={`w-6 h-6 mb-0.5 transition-colors ${isActive ? 'text-[--color-neural-blue]' : 'text-[--color-muted-grey]'}`} />
            <span className={`transition-colors ${isActive ? 'font-semibold text-[--color-neural-blue]' : 'text-[--color-muted-grey]'}`}>{label}</span>
        </button>
    );
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ currentView, onSetView, onSelectLesson }) => {
    const isLessonRelatedView = ['lesson', 'quiz'].includes(currentView);

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[--color-dark-matter]/90 backdrop-blur-lg border-t border-[--color-border] flex items-center justify-around md:hidden z-30">
            <NavItem view="dashboard" label="Home" icon={HomeIcon} isActive={currentView === 'dashboard'} onClick={() => onSetView('dashboard')} />
            <NavItem view="lesson" label="Lesson" icon={BookOpenIcon} isActive={isLessonRelatedView} onClick={onSelectLesson} />
            <NavItem view="mentor" label="Mentor" icon={SparklesIcon} isActive={currentView === 'mentor'} onClick={() => onSetView('mentor')} />
            <NavItem view="trading_journal" label="Journal" icon={ClipboardDocumentListIcon} isActive={currentView === 'trading_journal'} onClick={() => onSetView('trading_journal')} />
        </nav>
    );
};