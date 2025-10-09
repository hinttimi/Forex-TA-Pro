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
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-slate-100 dark:bg-slate-900">
            {/* Dark mode only background */}
             <div className="absolute inset-0 bg-transparent dark:bg-slate-950" style={{
                backgroundImage: `radial-gradient(ellipse 50% 40% at 20% 15%, rgba(14, 165, 233, 0.1), transparent),
                                  radial-gradient(ellipse 50% 40% at 80% 20%, rgba(139, 92, 246, 0.1), transparent)`
            }}></div>

            <div 
                className="relative bg-white/50 dark:bg-slate-800/50 backdrop-blur-lg border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-8 w-full max-w-2xl text-center animate-fade-in-up"
                role="dialog"
                aria-modal="true"
                aria-labelledby="onboarding-title"
            >
                 <div className="flex items-center justify-center space-x-3 mb-4">
                    <ChartBarIcon className="w-10 h-10 text-blue-600 dark:text-cyan-400" />
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Welcome to Forex TA Pro</h1>
                </div>

                <h2 id="onboarding-title" className="text-2xl font-bold text-slate-900 dark:text-white mt-6">
                    Let's Get You Set Up
                </h2>
                <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                    To power the AI-driven lessons and tools, Forex TA Pro requires your personal Google AI Gemini API key.
                </p>
                
                <div className="mt-8 text-left">
                     <label htmlFor="api-key-input" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Your Gemini API Key</label>
                    <input 
                        id="api-key-input"
                        type="password"
                        value={currentKey}
                        onChange={(e) => setCurrentKey(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                        placeholder="Paste your key here (it's kept private)"
                        className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg py-3 px-4 text-slate-900 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyan-500 focus:border-blue-500 dark:focus:border-cyan-500"
                        aria-label="Gemini API Key Input"
                    />
                </div>

                {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

                <div className="mt-8">
                     <button
                        onClick={handleSave}
                        disabled={!currentKey.trim() || isSaving}
                        className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-lg font-semibold rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 dark:text-slate-900 dark:bg-cyan-500 dark:hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-100 dark:focus:ring-offset-slate-800 focus:ring-blue-500 dark:focus:ring-cyan-500 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-transform duration-200 hover:scale-105"
                    >
                        {isSaving ? <CheckCircleIcon className="w-6 h-6 mr-2 animate-pulse"/> : <KeyIcon className="w-6 h-6 mr-2"/>}
                        {isSaving ? 'Connecting...' : 'Save & Start Learning'}
                    </button>
                </div>
                <p className="mt-6 text-xs text-slate-500">
                    You can get a free API key from{' '}
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-cyan-400 underline hover:text-blue-500 dark:hover:text-cyan-300">
                        Google AI Studio
                    </a>. Your key is stored only in your browser.
                </p>
            </div>
        </div>
    );
};