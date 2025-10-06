
import React from 'react';
import { ChartBarIcon } from './icons/ChartBarIcon';

export const Header: React.FC = () => {
  return (
    <header className="flex-shrink-0 bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 px-6 lg:px-10 py-4">
      <div className="flex items-center space-x-3">
        <ChartBarIcon className="w-8 h-8 text-cyan-400" />
        <h1 className="text-2xl font-bold tracking-tight text-white">Forex TA Pro</h1>
        <span className="bg-cyan-400/10 text-cyan-400 text-xs font-semibold px-2 py-1 rounded-full">AI Mentor</span>
      </div>
    </header>
  );
};
