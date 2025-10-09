import React from 'react';
import { Bars3Icon } from './icons/Bars3Icon';
import { useTheme } from '../hooks/useTheme';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';

interface HeaderProps {
  onToggleSidebar: () => void;
  viewTitle: string;
}

export const Header: React.FC<HeaderProps> = ({ 
  onToggleSidebar,
  viewTitle 
}) => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <header className="flex-shrink-0 bg-white dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-10 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-3 overflow-hidden">
         <button 
          onClick={onToggleSidebar} 
          className="p-1.5 text-slate-500 dark:text-slate-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyan-500"
          aria-label="Toggle sidebar"
         >
            <Bars3Icon className="w-6 h-6" />
        </button>
        <div className="flex items-center overflow-hidden">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">{viewTitle}</h1>
        </div>
      </div>
       <button
        onClick={toggleTheme}
        className="p-1.5 text-slate-500 dark:text-slate-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyan-500"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
      </button>
    </header>
  );
};