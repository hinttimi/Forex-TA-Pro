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
                className="bg-[--color-dark-matter] border border-[--color-border] rounded-xl shadow-2xl p-8 w-full max-w-lg mx-4 text-center transform transition-all"
                onClick={e => e.stopPropagation()}
            >
                <KeyIcon className="w-16 h-16 mx-auto text-[--color-neural-blue] mb-4" />
                <h2 id="api-key-modal-title" className="text-2xl font-bold text-[--color-ghost-white]">
                    {apiKey ? 'Update' : 'Set'} Your Gemini API Key
                </h2>
                <p className="mt-2 text-[--color-muted-grey]">
                    Your Gemini API key is required to power the AI features of the app.
                </p>
                <div className="mt-6">
                    <input 
                        type="password"
                        value={currentKey}
                        onChange={(e) => setCurrentKey(e.target.value)}
                        placeholder="Paste your API key here"
                        className="w-full bg-[--color-obsidian-slate] border border-[--color-border] rounded-md py-3 px-4 text-[--color-ghost-white] placeholder-[--color-muted-grey] focus:ring-2 focus:ring-[--color-neural-blue] focus:border-[--color-neural-blue]"
                        aria-label="Gemini API Key Input"
                    />
                </div>
                <div className="mt-6 flex flex-col sm:flex-row-reverse gap-3">
                     <button
                        onClick={handleSave}
                        disabled={!currentKey.trim() || isSaved}
                        className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-[--color-obsidian-slate] bg-[--color-neural-blue] hover:bg-[--color-neural-blue]/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[--color-dark-matter] focus:ring-[--color-neural-blue] disabled:bg-[--color-border] disabled:cursor-not-allowed"
                    >
                        {isSaved ? <CheckCircleIcon className="w-5 h-5 mr-2"/> : null}
                        {isSaved ? 'Key Saved!' : 'Save Key'}
                    </button>
                    <button
                        type="button"
                        onClick={closeKeyModal}
                        className="w-full inline-flex justify-center rounded-md border border-[--color-border] shadow-sm px-4 py-3 bg-[--color-dark-matter] text-base font-medium text-[--color-ghost-white] hover:bg-[--color-border] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[--color-dark-matter] focus:ring-[--color-neural-blue] sm:mt-0"
                    >
                        Cancel
                    </button>
                </div>
                 <p className="mt-6 text-xs text-[--color-muted-grey]/80">
                    Get your free API key from{' '}
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-[--color-neural-blue] underline hover:opacity-80">
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
