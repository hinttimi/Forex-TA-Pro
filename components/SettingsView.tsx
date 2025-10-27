import React from 'react';
import { TrashIcon } from './icons/TrashIcon';
import { ServerStackIcon } from './icons/ServerStackIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { MENTOR_PERSONAS, MENTOR_VOICES } from '../constants/mentorSettings';
import { useMentorSettings } from '../hooks/useMentorSettings';

const maskApiKey = (key: string | null): string => {
    if (!key || key.length < 8) {
        return 'Not Set';
    }
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
};

interface ApiKeyInputRowProps {
    label: string;
    storageKey: string;
}

const ApiKeyInputRow: React.FC<ApiKeyInputRowProps> = ({ label, storageKey }) => {
    const [storedKey, setStoredKey] = React.useState<string | null>(() => localStorage.getItem(storageKey));
    const [inputKey, setInputKey] = React.useState('');
    const [isEditing, setIsEditing] = React.useState(false);

    const handleSave = () => {
        if (inputKey.trim()) {
            localStorage.setItem(storageKey, inputKey.trim());
            setStoredKey(inputKey.trim());
            setIsEditing(false);
            setInputKey('');
        }
    };

    const handleClear = () => {
        localStorage.removeItem(storageKey);
        setStoredKey(null);
        setInputKey('');
        setIsEditing(false);
    }

    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-gray-700/50 last:border-b-0">
            <span className="text-gray-300 font-medium">{label}</span>
            <div className="flex items-center gap-3 mt-2 sm:mt-0">
                {isEditing ? (
                    <>
                        <input
                            type="password"
                            value={inputKey}
                            onChange={(e) => setInputKey(e.target.value)}
                            placeholder="Paste new key"
                            className="flex-grow bg-gray-700 border border-gray-600 rounded-md py-1 px-2 text-sm text-white focus:ring-1 focus:ring-cyan-500"
                        />
                        <button onClick={handleSave} className="px-3 py-1 bg-cyan-600 text-white text-sm font-semibold rounded-md hover:bg-cyan-500">Save</button>
                        <button onClick={() => setIsEditing(false)} className="px-3 py-1 bg-gray-600 text-white text-sm font-semibold rounded-md hover:bg-gray-500">Cancel</button>
                    </>
                ) : (
                    <>
                        <span className="font-mono text-sm text-gray-400">{maskApiKey(storedKey)}</span>
                        <button onClick={() => setIsEditing(true)} className="px-3 py-1 bg-gray-600 text-white text-sm font-semibold rounded-md hover:bg-gray-500">
                            {storedKey ? 'Update' : 'Set'}
                        </button>
                        {storedKey && <button onClick={handleClear} className="px-2 py-1 bg-red-800/50 text-red-300 text-sm font-semibold rounded-md hover:bg-red-800/80">Clear</button>}
                    </>
                )}
            </div>
        </div>
    );
};


export const SettingsView: React.FC = () => {
    const { personaId, setPersonaId, voiceId, setVoiceId } = useMentorSettings();

    const handleClearData = () => {
        if (window.confirm('Are you sure you want to clear all app data? This will remove all API keys, lesson progress, and unlocked badges. This action cannot be undone.')) {
            try {
                // Explicitly remove all known keys for robustness
                const keysToRemove = [
                    'gemini_api_key', // Legacy key, remove just in case
                    'completedLessons',
                    'completionCounts',
                    'unlockedBadges',
                    'savedAnalyses',
                    'userTradingPlan',
                    'theme',
                    'user_fcsapi_api_key',
                    'user_open_exchange_rates_api_key',
                    'user_twelve_data_api_key',
                    'aiMentorChatHistory',
                    'forex_ta_pro_tour_seen',
                    'mentorSettings',
                ];

                keysToRemove.forEach(key => {
                    localStorage.removeItem(key);
                });
                
                // Clear all Firebase data by signing out, which triggers data reset in contexts
                // A more robust solution would be a cloud function to delete user doc, but sign out is sufficient for client-side clearing
                alert('All local application data has been cleared. Please sign out and sign back in to reset server data. The app will now reload.');
                window.location.reload();
            } catch (error) {
                console.error('Failed to clear localStorage:', error);
                alert('Could not clear all data. Please try clearing your browser cache manually.');
            }
        }
    };

    const marketDataProviders = [
        { label: 'FCSAPI', storageKey: 'user_fcsapi_api_key' },
        { label: 'Open Exchange Rates', storageKey: 'user_open_exchange_rates_api_key' },
        { label: 'Twelve Data', storageKey: 'user_twelve_data_api_key' },
    ];

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">Settings</h1>
            <p className="text-gray-400 mb-8">Manage your AI mentor, data providers, and application data.</p>
            
            <div className="space-y-8">
                {/* Mentor Customization */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                        <SparklesIcon className="w-6 h-6 mr-3 text-cyan-400" />
                        AI Mentor Customization
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-base font-semibold text-white mb-2">Mentor Persona</h3>
                            <div className="space-y-2">
                                {MENTOR_PERSONAS.map(p => (
                                    <label key={p.id} className="flex items-start p-3 bg-gray-900/50 border border-gray-700 rounded-md cursor-pointer hover:bg-gray-700/50 transition-colors">
                                        <input type="radio" name="persona" value={p.id} checked={personaId === p.id} onChange={(e) => setPersonaId(e.target.value)} className="mt-1 h-4 w-4 text-cyan-500 bg-gray-700 border-gray-600 focus:ring-cyan-600 focus:ring-offset-gray-800" />
                                        <span className="ml-3 text-sm">
                                            <span className="font-medium text-gray-200">{p.name}</span>
                                            <span className="block text-gray-400">{p.description}</span>
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-white mb-2">Voice (for Live Chat & TTS)</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {MENTOR_VOICES.map(v => (
                                     <label key={v.id} className="flex items-center p-2 bg-gray-900/50 border border-gray-700 rounded-md cursor-pointer hover:bg-gray-700/50 transition-colors">
                                        <input type="radio" name="voice" value={v.id} checked={voiceId === v.id} onChange={(e) => setVoiceId(e.target.value)} className="h-4 w-4 text-cyan-500 bg-gray-700 border-gray-600 focus:ring-cyan-600 focus:ring-offset-gray-800"/>
                                        <span className="ml-2 text-sm text-gray-300">{v.name}</span>
                                     </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>


                 {/* Market Data API Keys */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                        <ServerStackIcon className="w-6 h-6 mr-3 text-cyan-400" />
                        Market Data API Keys (Optional)
                    </h2>
                    <p className="text-gray-400 text-sm mb-4">
                        The app uses shared keys for market data, which have limits. Providing your own free keys can prevent rate-limit errors during heavy use of tools like the AI Strategy Lab.
                    </p>
                    <div className="space-y-2">
                        {marketDataProviders.map(provider => (
                            <ApiKeyInputRow key={provider.storageKey} {...provider} />
                        ))}
                    </div>
                </div>

                {/* Data Management */}
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                         <TrashIcon className="w-6 h-6 mr-3 text-red-400" />
                        Data Management
                    </h2>
                    <p className="text-red-300/80 text-sm mb-4">
                        This will permanently delete all your local data from this browser, including optional market data keys. Your progress is saved to your account.
                    </p>
                    <button
                        onClick={handleClearData}
                        className="w-full sm:w-auto inline-flex justify-center items-center px-5 py-2 bg-red-600 text-white font-semibold rounded-md shadow-sm hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-900/50 focus:ring-red-500"
                    >
                        Clear Local App Data
                    </button>
                </div>
            </div>
        </div>
    );
};
