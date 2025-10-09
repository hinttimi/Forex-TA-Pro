import React, { useState, useCallback } from 'react';
import { CurrencyStrengthMeter } from './widgets/CurrencyStrengthMeter';
import { VolatilityMonitor } from './widgets/VolatilityMonitor';
import { CorrelationMatrix } from './widgets/CorrelationMatrix';
import { MarketSentiment } from './widgets/MarketSentiment';
import { SparklesIcon } from './icons/SparklesIcon';
import { useApiKey } from '../hooks/useApiKey';
import { generateMarketNarrative } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { useMarketDynamics } from '../hooks/useMarketDynamics';

const FormattedContent: React.FC<{ text: string }> = ({ text }) => {
    const renderInlineMarkdown = (text: string): React.ReactNode => {
        const parts: React.ReactNode[] = [];
        let lastIndex = 0;
        const regex = /\*\*(.*?)\*\*/g;
        let match;
        let key = 0;

        while ((match = regex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                parts.push(text.substring(lastIndex, match.index));
            }
            parts.push(<strong key={`strong-${key++}`} className="font-bold text-blue-600 dark:text-cyan-300">{match[1]}</strong>);
            lastIndex = regex.lastIndex;
        }

        if (lastIndex < text.length) {
            parts.push(text.substring(lastIndex));
        }

        return <>{parts}</>;
    };

    const cleanedText = text
        .replace(/\n\s*-\s/g, ' - ')
        .replace(/\*{2,}(.*?)\*/g, '**$1**')
        .replace(/^\s*\*\*(.*)/gm, '* **$1');

    const lines = cleanedText.split('\n').filter(line => line.trim());
    const elements: React.ReactElement[] = [];
    let currentListItems: React.ReactElement[] = [];

    const flushList = () => {
        if (currentListItems.length > 0) {
            elements.push(<ul key={`ul-${elements.length}`} className="list-disc space-y-3 my-3 pl-6">{currentListItems}</ul>);
            currentListItems = [];
        }
    };
    
    lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        
        if (trimmedLine.startsWith('### ')) {
            flushList();
            elements.push(<h3 key={`h-${index}`} className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">{trimmedLine.substring(4)}</h3>);
        } else if (trimmedLine.startsWith('* ')) {
            const content = trimmedLine.substring(2);
            currentListItems.push(<li key={`li-${index}`}>{renderInlineMarkdown(content)}</li>);
        } else {
            flushList();
            const isHeading = trimmedLine.length < 50 && !trimmedLine.endsWith('.') && !trimmedLine.endsWith(':');
            if (isHeading && !trimmedLine.includes('**')) {
                 elements.push(<h3 key={`h-${index}`} className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">{trimmedLine}</h3>);
            } else {
                 elements.push(<p key={`p-${index}`} className="mb-3 leading-relaxed">{renderInlineMarkdown(trimmedLine)}</p>);
            }
        }
    });

    flushList();
    return <>{elements}</>;
};


export const MarketDynamicsDashboard: React.FC = () => {
    const { data, loading } = useMarketDynamics();
    
    const [narrative, setNarrative] = useState<string>('');
    const [isLoadingNarrative, setIsLoadingNarrative] = useState(false);
    const [narrativeError, setNarrativeError] = useState<string | null>(null);

    const { apiKey } = useApiKey();

    const allDataLoaded = data.strength && data.volatility.length > 0 && data.correlation && data.sentiment;
    const anyDataLoading = loading.strength || loading.volatility || loading.correlation || loading.sentiment;


    const handleGenerateNarrative = useCallback(async () => {
        if (!apiKey || !allDataLoaded) return;

        setIsLoadingNarrative(true);
        setNarrativeError(null);
        setNarrative('');
        
        const combinedData = {
            marketSentiment: data.sentiment,
            currencyStrength: data.strength,
            volatility: data.volatility,
            correlation: data.correlation,
        };

        try {
            const result = await generateMarketNarrative(apiKey, JSON.stringify(combinedData, null, 2));
            setNarrative(result);
        } catch (e) {
            console.error(e);
            setNarrativeError("The AI couldn't generate a narrative. Please try again.");
        } finally {
            setIsLoadingNarrative(false);
        }

    }, [apiKey, allDataLoaded, data]);

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">Market Dynamics Dashboard</h1>
                <p className="text-gray-400">Get an AI-powered, at-a-glance overview of the live forex market.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CurrencyStrengthMeter />
                <VolatilityMonitor />
                <MarketSentiment />
                <CorrelationMatrix />
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-white mb-3">AI Market Narrative</h2>
                <button 
                    onClick={handleGenerateNarrative}
                    disabled={!allDataLoaded || isLoadingNarrative}
                    className="inline-flex items-center px-5 py-2.5 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-500 disabled:bg-slate-600 disabled:cursor-not-allowed"
                >
                    <SparklesIcon className="w-5 h-5 mr-2" />
                    {isLoadingNarrative ? 'Analyzing...' : 'Tell Me The Narrative'}
                </button>
                <div className="mt-4 pt-4 border-t border-slate-700/50">
                    {isLoadingNarrative && <div className="flex justify-center items-center gap-3"><LoadingSpinner /><span className="text-slate-400">AI is putting the pieces together...</span></div>}
                    {narrativeError && <p className="text-red-400">{narrativeError}</p>}
                    {narrative && (
                        <div className="prose prose-invert prose-sm max-w-none text-slate-300 animate-[fade-in_0.5s]">
                            <FormattedContent text={narrative} />
                        </div>
                    )}
                     {!narrative && !isLoadingNarrative && !narrativeError && (
                        <p className="text-center text-slate-500 italic">
                            {anyDataLoading ? 'Waiting for all widgets to load...' : 'Generate a narrative after all widgets have loaded their data.'}
                        </p>
                     )}
                </div>
            </div>
            <style>{`@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }`}</style>
        </div>
    );
};