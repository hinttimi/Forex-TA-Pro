import React, { useState } from 'react';
import { useApiKey } from '../hooks/useApiKey';
import { KeyIcon } from './icons/KeyIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

export const ApiKeyModal: React.FC = () => {
    const { apiKey, setApiKey, isKeyModalOpen, closeKeyModal } = useApiKey();
    const [currentKey, setCurrentKey] = useState(apiKey || '');
    const [isSaved, setIsSaved] = useState(false);

    const handleSave = () => {
        if (currentKey.trim()) {
            setApiKey(currentKey.trim());
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
        }
    };
    
    if (!isKeyModalOpen) {
        return null;
    }

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm"
            aria-labelledby="api-key-modal-title"
            role="dialog"
            aria-modal="true"
        >
            <div 
                className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-8 w-full max-w-lg mx-4 text-center transform transition-all"
                onClick={e => e.stopPropagation()}
            >
                <KeyIcon className="w-16 h-16 mx-auto text-cyan-400 mb-4" />
                <h2 id="api-key-modal-title" className="text-2xl font-bold text-white">
                    Enter Your Gemini API Key
                </h2>
                <p className="mt-2 text-gray-400">
                    To use the AI features of Forex TA Pro, you need to provide your own Google AI Gemini API key. This ensures you have a personal, non-rate-limited experience.
                </p>
                <div className="mt-6">
                    <input 
                        type="password"
                        value={currentKey}
                        onChange={(e) => setCurrentKey(e.target.value)}
                        placeholder="Paste your API key here"
                        className="w-full bg-gray-900 border border-gray-600 rounded-md py-3 px-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                        aria-label="Gemini API Key Input"
                    />
                </div>
                <div className="mt-6 flex flex-col sm:flex-row-reverse gap-3">
                     <button
                        onClick={handleSave}
                        disabled={!currentKey.trim()}
                        className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-gray-900 bg-cyan-500 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                        {isSaved ? <CheckCircleIcon className="w-5 h-5 mr-2"/> : null}
                        {isSaved ? 'Key Saved!' : 'Save and Continue'}
                    </button>
                    {apiKey && (
                        <button
                            type="button"
                            onClick={closeKeyModal}
                            className="w-full inline-flex justify-center rounded-md border border-gray-600 shadow-sm px-4 py-3 bg-gray-700 text-base font-medium text-gray-200 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-600 sm:mt-0"
                        >
                            Cancel
                        </button>
                    )}
                </div>
                <p className="mt-6 text-xs text-gray-500">
                    You can get your free API key from{' '}
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline hover:text-cyan-300">
                        Google AI Studio
                    </a>. Your key is stored securely in your browser's local storage.
                </p>
            </div>
        </div>
    );
};
