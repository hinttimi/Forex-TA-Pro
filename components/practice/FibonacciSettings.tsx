import React, { useState } from 'react';
import type { FibLevel } from './FreePracticeCanvasView';
import { TrashIcon } from '../icons/TrashIcon';
import { PlusIcon } from '../icons/PlusIcon';

interface FibonacciSettingsProps {
    levels: FibLevel[];
    setLevels: (levels: FibLevel[]) => void;
}

export const FibonacciSettings: React.FC<FibonacciSettingsProps> = ({ levels, setLevels }) => {
    const [newLevel, setNewLevel] = useState('');

    const handleToggle = (levelToToggle: number) => {
        setLevels(levels.map(l => l.level === levelToToggle ? { ...l, enabled: !l.enabled } : l));
    };

    const handleAdd = () => {
        const levelValue = parseFloat(newLevel);
        if (!isNaN(levelValue) && !levels.some(l => l.level === levelValue)) {
            setLevels([...levels, { level: levelValue, enabled: true }].sort((a,b) => a.level - b.level));
            setNewLevel('');
        }
    };

    const handleRemove = (levelToRemove: number) => {
        if (levelToRemove === 0 || levelToRemove === 1) return; // Prevent removing 0 and 1
        setLevels(levels.filter(l => l.level !== levelToRemove));
    };

    return (
        <div className="mt-4 p-3 bg-gray-800/90 backdrop-blur-sm rounded-lg border border-gray-700 w-full max-w-xs animate-[fade-in_0.2s_ease-out]">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Fibonacci Levels</h3>
            <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                {levels.map(({ level, enabled }) => (
                    <div key={level} className="flex items-center justify-between text-sm">
                        <label className="flex items-center space-x-2 text-gray-300 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={enabled}
                                onChange={() => handleToggle(level)}
                                className="form-checkbox h-4 w-4 bg-gray-700 border-gray-600 rounded text-cyan-500 focus:ring-cyan-600 focus:ring-offset-gray-800"
                            />
                            <span>{level.toFixed(3)}</span>
                        </label>
                        {(level !== 0 && level !== 1) && (
                           <button onClick={() => handleRemove(level)} className="text-gray-500 hover:text-red-400" aria-label={`Remove level ${level}`}>
                               <TrashIcon className="w-4 h-4" />
                           </button>
                        )}
                    </div>
                ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-700 flex items-center space-x-2">
                <input
                    type="number"
                    step="0.001"
                    value={newLevel}
                    onChange={(e) => setNewLevel(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    placeholder="e.g. -0.27"
                    className="flex-grow bg-gray-900 border border-gray-600 rounded-md px-2 py-1 text-sm text-white focus:ring-cyan-500 focus:border-cyan-500"
                />
                <button
                    onClick={handleAdd}
                    className="p-1.5 bg-cyan-500 text-gray-900 rounded-md hover:bg-cyan-400 disabled:bg-gray-600"
                    disabled={!newLevel}
                    aria-label="Add new Fibonacci level"
                >
                    <PlusIcon className="w-4 h-4" />
                </button>
            </div>
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .form-checkbox {
                    appearance: none;
                    -webkit-appearance: none;
                    width: 1rem;
                    height: 1rem;
                    border: 1px solid #4b5563;
                    border-radius: 0.25rem;
                    background-color: #374151;
                    display: inline-block;
                    position: relative;
                    cursor: pointer;
                }
                .form-checkbox:checked { 
                    background-color: #06b6d4;
                    border-color: #0891b2;
                }
                .form-checkbox:checked::after {
                    content: '✓';
                    position: absolute;
                    color: #111827;
                    font-size: 0.75rem;
                    line-height: 1rem;
                    top: -1px;
                    left: 2px;
                }
             `}</style>
        </div>
    );
}
