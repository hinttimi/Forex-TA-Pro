import React, { useState, useEffect } from 'react';
import { useApiKey } from '../hooks/useApiKey';
import { KeyIcon } from './icons/KeyIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { TrashIcon } from './icons/TrashIcon';

const maskApiKey = (key: string | null): string => {
    if (!key || key.length < 8) {
        return 'No key set';
    }
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
};

export const SettingsView: React.FC = () => {
    const { apiKey, setApiKey } = useApiKey();
    const [keyInput, setKeyInput] = useState('');
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        setKeyInput(apiKey || '');
    }, [apiKey]);

    const handleSave = () => {
        if (keyInput.trim()) {
            setApiKey(keyInput.trim());
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 3000);
        }
    };

    const handleClearData = () => {
        if (window.confirm('Are you sure you want to clear all app data? This will remove your API key, all lesson progress, and unlocked badges. This action cannot be undone.')) {
            try {
                localStorage.clear();
                alert('All application data has been cleared. The app will now reload.');
                window.location.reload();
            } catch (error) {
                console.error('Failed to clear localStorage:', error);
                alert('Could not clear all data. Please try clearing your browser cache manually.');
            }
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">Settings</h1>
            <p className="text-gray-400 mb-8">Manage your API key and application data.</p>
            
            <div className="space-y-8">
                {/* API Key Management */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                        <KeyIcon className="w-6 h-6 mr-3 text-cyan-400" />
                        API Key Management
                    </h2>
                    <p className="text-gray-400 text-sm mb-4">
                        Your Google AI Gemini API key is stored securely in your browser's local storage and is never sent to any server besides Google's.
                    </p>
                    <div className="mb-4">
                        <label htmlFor="apiKey" className="block text-sm font-semibold text-gray-300 mb-1">Current API Key</label>
                        <div className="p-3 bg-gray-900/50 rounded-md font-mono text-gray-400">
                            {maskApiKey(apiKey)}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="updateApiKey" className="block text-sm font-semibold text-gray-300 mb-1">Update Your Key</label>
                        <div className="flex items-center gap-3">
                            <input
                                id="updateApiKey"
                                type="password"
                                value={keyInput}
                                onChange={(e) => setKeyInput(e.target.value)}
                                placeholder="Paste new API key here"
                                className="flex-grow bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-cyan-500"
                            />
                            <button
                                onClick={handleSave}
                                disabled={!keyInput.trim()}
                                className="inline-flex justify-center items-center px-5 py-2 bg-cyan-500 text-gray-900 font-semibold rounded-md shadow-sm hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
                            >
                                {isSaved ? <CheckCircleIcon className="w-5 h-5"/> : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Data Management */}
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                         <TrashIcon className="w-6 h-6 mr-3 text-red-400" />
                        Data Management
                    </h2>
                    <p className="text-red-300/80 text-sm mb-4">
                        This will permanently delete all your data from this browser, including your saved API key, lesson completions, and achievements.
                    </p>
                    <button
                        onClick={handleClearData}
                        className="w-full sm:w-auto inline-flex justify-center items-center px-5 py-2 bg-red-600 text-white font-semibold rounded-md shadow-sm hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-900/50 focus:ring-red-500"
                    >
                        Clear All App Data
                    </button>
                </div>
            </div>
        </div>
    );
};