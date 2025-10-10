import React from 'react';
import { Bars3Icon } from './icons/Bars3Icon';

interface HeaderProps {
  onToggleSidebar: () => void;
  viewTitle: string;
}

export const Header: React.FC<HeaderProps> = ({ 
  onToggleSidebar,
  viewTitle 
}) => {
  
  return (
    <header className="flex-shrink-0 bg-[--color-dark-matter]/80 backdrop-blur-sm border-b border-[--color-border] px-4 sm:px-6 lg:px-10 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-3 overflow-hidden">
         <button 
          onClick={onToggleSidebar} 
          className="p-1.5 text-[--color-muted-grey] rounded-md hover:bg-[--color-dark-matter] hover:text-[--color-ghost-white] focus:outline-none focus:ring-2 focus:ring-[--color-neural-blue]"
          aria-label="Toggle sidebar"
         >
            <Bars3Icon className="w-6 h-6" />
        </button>
        <div className="flex items-center overflow-hidden">
            <h1 className="text-lg font-semibold text-[--color-ghost-white] truncate">{viewTitle}</h1>
        </div>
      </div>
    </header>
  );
};