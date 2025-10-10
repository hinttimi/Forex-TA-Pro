

import React from 'react';
import { PhotoIcon } from './icons/PhotoIcon';

export const ChartSkeleton: React.FC<{ loadingText: string }> = ({ loadingText }) => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[--color-dark-matter] rounded-lg animate-pulse">
        <PhotoIcon className="w-16 h-16 text-[--color-border]" />
        <span className="mt-3 text-sm text-[--color-muted-grey]">{loadingText}</span>
    </div>
);
