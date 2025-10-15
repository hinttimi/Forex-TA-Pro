import React, { useState, useEffect } from 'react';
import { TrashIcon } from './icons/TrashIcon';
import { BookmarkSquareIcon } from './icons/BookmarkSquareIcon';
import { RocketLaunchIcon } from './icons/RocketLaunchIcon';
import { AppView } from '../types';

interface SavedItem {
    id: number;
    imageData: string;
}

interface SavedAnalysisViewProps {
    onSetView: (view: AppView) => void;
}

export const SavedAnalysisView: React.FC<SavedAnalysisViewProps> = ({ onSetView }) => {
    const [analyses, setAnalyses] = useState<SavedItem[]>([]);

    useEffect(() => {
        try {
            const savedData = localStorage.getItem('savedAnalyses');
            if (savedData) {
                setAnalyses(JSON.parse(savedData));
            }
        } catch (error) {
            console.error("Failed to load saved analyses from local storage:", error);
            // Optionally clear corrupted data
            localStorage.removeItem('savedAnalyses');
        }
    }, []);

    const handleClear = () => {
        if (window.confirm('Are you sure you want to delete all saved analyses? This action cannot be undone.')) {
            localStorage.removeItem('savedAnalyses');
            setAnalyses([]);
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight">Saved Analysis</h1>
                    <p className="text-[--color-muted-grey] mt-1">Review your saved trade setups from the simulator.</p>
                </div>
                {analyses.length > 0 && (
                     <button 
                        onClick={handleClear} 
                        className="mt-4 sm:mt-0 flex items-center px-4 py-2 bg-[--color-warning-red]/20 text-[--color-warning-red] font-semibold rounded-lg hover:bg-[--color-warning-red]/30 transition-colors"
                    >
                        <TrashIcon className="w-5 h-5 mr-2" />
                        Clear All
                    </button>
                )}
            </div>
            
            {analyses.length === 0 ? (
                <div className="text-center py-20 bg-[--color-dark-matter]/50 border-2 border-dashed border-[--color-border] rounded-xl">
                    <BookmarkSquareIcon className="w-16 h-16 mx-auto text-[--color-muted-grey]/50 mb-4" />
                    <h2 className="text-2xl font-bold text-[--color-ghost-white]">No Saved Analyses Yet</h2>
                    <p className="text-[--color-muted-grey] mt-2 max-w-md mx-auto">Go to the Trade Simulator, complete a scenario, and click "Save Analysis" to store your work here for future review.</p>
                    <button onClick={() => onSetView('simulator')} className="mt-6 inline-flex items-center px-5 py-2.5 bg-[--color-dark-matter] text-[--color-ghost-white] font-semibold rounded-lg shadow-sm hover:bg-[--color-border] transition-colors">
                        <RocketLaunchIcon className="w-5 h-5 mr-2" />
                        Go to Trade Simulator
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {analyses.map(item => (
                        <div key={item.id} className="bg-[--color-dark-matter]/70 border border-[--color-border] rounded-lg overflow-hidden shadow-lg animate-[fade-in_0.5s_ease-out]">
                            <img src={item.imageData} alt={`Saved analysis from ${new Date(item.id).toLocaleString()}`} className="w-full object-cover" />
                            <div className="p-3 text-xs text-[--color-muted-grey] bg-[--color-obsidian-slate]/50">
                                Saved on: {new Date(item.id).toLocaleString()}
                            </div>
                        </div>
                    ))}
                </div>
            )}
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
             `}</style>
        </div>
    );
};