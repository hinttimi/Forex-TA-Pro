import React, { useState, useEffect } from 'react';
import { useApiKey } from '../hooks/useApiKey';
import { KeyIcon } from './icons/KeyIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

export const ApiKeyModal: React.FC = () => {
    const { apiKey, setApiKey, isKeyModalOpen, closeKeyModal } = useApiKey();
    const [currentKey, setCurrentKey] = useState('');
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        if (isKeyModalOpen) {
            setCurrentKey(apiKey || '');
        }
    }, [isKeyModalOpen, apiKey]);

    const handleSave = () => {
        if (currentKey.trim()) {
            setApiKey(currentKey.trim());
            setIsSaved(true);
            setTimeout(() => {
                setIsSaved(false);
                closeKeyModal();
            }, 1500);
        }
    };
    
    if (!isKeyModalOpen) {
        return null;
    }

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]"
            onClick={closeKeyModal}
            aria-labelledby="api-key-modal-title"
            role="dialog"
            aria-modal="true"
        >
            <div 
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-8 w-full max-w-lg mx-4 text-center transform transition-all"
                onClick={e => e.stopPropagation()}
            >
                <KeyIcon className="w-16 h-16 mx-auto text-blue-500 dark:text-cyan-400 mb-4" />
                <h2 id="api-key-modal-title" className="text-2xl font-bold text-slate-900 dark:text-white">
                    {apiKey ? 'Update' : 'Set'} Your Gemini API Key
                </h2>
                <p className="mt-2 text-slate-600 dark:text-slate-400">
                    Your Gemini API key is required to power the AI features of the app.
                </p>
                <div className="mt-6">
                    <input 
                        type="password"
                        value={currentKey}
                        onChange={(e) => setCurrentKey(e.target.value)}
                        placeholder="Paste your API key here"
                        className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md py-3 px-4 text-slate-900 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyan-500 focus:border-blue-500 dark:focus:border-cyan-500"
                        aria-label="Gemini API Key Input"
                    />
                </div>
                <div className="mt-6 flex flex-col sm:flex-row-reverse gap-3">
                     <button
                        onClick={handleSave}
                        disabled={!currentKey.trim() || isSaved}
                        className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 dark:text-slate-900 dark:bg-cyan-500 dark:hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-blue-500 dark:focus:ring-cyan-500 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
                    >
                        {isSaved ? <CheckCircleIcon className="w-5 h-5 mr-2"/> : null}
                        {isSaved ? 'Key Saved!' : 'Save Key'}
                    </button>
                    <button
                        type="button"
                        onClick={closeKeyModal}
                        className="w-full inline-flex justify-center rounded-md border border-slate-300 dark:border-slate-600 shadow-sm px-4 py-3 bg-white dark:bg-slate-700 text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-blue-500 dark:focus:ring-cyan-600 sm:mt-0"
                    >
                        Cancel
                    </button>
                </div>
                 <p className="mt-6 text-xs text-slate-500">
                    Get your free API key from{' '}
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-cyan-400 underline hover:text-blue-500 dark:hover:text-cyan-300">
                        Google AI Studio
                    </a>.
                </p>
            </div>
             <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    );
};