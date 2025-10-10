import React from 'react';

export const LessonSkeleton: React.FC = () => (
    <div className="animate-pulse">
        <div className="h-10 bg-[--color-border] rounded-md w-3/4 mb-8"></div>
        <div className="space-y-5">
            <div className="h-4 bg-[--color-border] rounded-md w-full"></div>
            <div className="h-4 bg-[--color-border] rounded-md w-5/6"></div>
            <div className="h-4 bg-[--color-border] rounded-md w-full mb-4"></div>
            <div className="h-4 bg-[--color-border] rounded-md w-full"></div>
            <div className="h-4 bg-[--color-border] rounded-md w-3/4"></div>
            <div className="h-4 bg-[--color-border] rounded-md w-1/2"></div>
        </div>
    </div>
);
