import React from 'react';
import { PhotoIcon } from './icons/PhotoIcon';

export const ChartSkeleton: React.FC<{ loadingText: string }> = ({ loadingText }) => (
    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-800 rounded-lg animate-pulse">
        <PhotoIcon className="w-16 h-16 text-slate-600" />
        <span className="mt-3 text-sm text-slate-500">{loadingText}</span>
    </div>
);
