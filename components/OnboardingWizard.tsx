import React, { useState } from 'react';
import { useApiKey } from '../hooks/useApiKey';
import { KeyIcon } from './icons/KeyIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';

export const OnboardingWizard: React.FC = () => {
    const { setApiKey } = useApiKey();
    const [currentKey, setCurrentKey] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSave = () => {
        if (currentKey.trim()) {
            setIsSaving(true);
            setError('');
            // A small delay to give feedback to the user
            setTimeout(() => {
                setApiKey(currentKey.trim());
                // The App component will now re-render and show the main UI
            }, 500);
        } else {
            setError('Please enter a valid API key.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-[--color-obsidian-slate]">
             <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(ellipse 50% 40% at 20% 15%, rgba(0, 191, 255, 0.1), transparent),
                                  radial-gradient(ellipse 50% 40% at 80% 20%, rgba(139, 92, 246, 0.1), transparent)`
            }}></div>

            <div 
                className="relative bg-[--color-dark-matter]/50 backdrop-blur-lg border border-[--color-border] rounded-2xl shadow-2xl p-8 w-full max-w-2xl text-center animate-fade-in-up"
                role="dialog"
                aria-modal="true"
                aria-labelledby="onboarding-title"
            >
                 <div className="flex items-center justify-center space-x-3 mb-4">
                    <ChartBarIcon className="w-10 h-10 text-[--color-neural-blue]" />
                    <h1 className="text-3xl font-bold tracking-tight text-[--color-ghost-white]">Welcome to Forex TA Pro</h1>
                </div>

                <h2 id="onboarding-title" className="text-2xl font-bold text-[--color-ghost-white] mt-6">
                    Let's Get You Set Up
                </h2>
                <p className="mt-2 text-[--color-muted-grey] max-w-md mx-auto">
                    To power the AI-driven lessons and tools, Forex TA Pro requires your personal Google AI Gemini API key.
                </p>
                
                <div className="mt-8 text-left">
                     <label htmlFor="api-key-input" className="block text-sm font-medium text-[--color-ghost-white]/80 mb-2">Your Gemini API Key</label>
                    <input 
                        id="api-key-input"
                        type="password"
                        value={currentKey}
                        onChange={(e) => setCurrentKey(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                        placeholder="Paste your key here (it's kept private)"
                        className="w-full bg-[--color-obsidian-slate] border border-[--color-border] rounded-lg py-3 px-4 text-[--color-ghost-white] placeholder-[--color-muted-grey] focus:ring-2 focus:ring-[--color-neural-blue] focus:border-[--color-neural-blue]"
                        aria-label="Gemini API Key Input"
                    />
                </div>

                {error && <p className="mt-2 text-sm text-[--color-warning-red]">{error}</p>}

                <div className="mt-8">
                     <button
                        onClick={handleSave}
                        disabled={!currentKey.trim() || isSaving}
                        className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-lg font-semibold rounded-lg shadow-sm text-[--color-obsidian-slate] bg-[--color-neural-blue] hover:bg-[--color-neural-blue]/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[--color-dark-matter] focus:ring-[--color-neural-blue] disabled:bg-[--color-border] disabled:cursor-not-allowed transition-transform duration-200 hover:scale-105"
                    >
                        {isSaving ? <CheckCircleIcon className="w-6 h-6 mr-2 animate-pulse"/> : <KeyIcon className="w-6 h-6 mr-2"/>}
                        {isSaving ? 'Connecting...' : 'Save & Start Learning'}
                    </button>
                </div>
                <p className="mt-6 text-xs text-[--color-muted-grey]/80">
                    You can get a free API key from{' '}
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-[--color-neural-blue] underline hover:opacity-80">
                        Google AI Studio
                    </a>. Your key is stored only in your browser.
                </p>
            </div>
        </div>
    );
};
