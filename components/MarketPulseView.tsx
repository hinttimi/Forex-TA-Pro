import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { SignalIcon } from './icons/SignalIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';
import { useApiKey } from '../hooks/useApiKey';
import { useMarketIntel } from '../hooks/useMarketIntel';
import { ArrowPathIcon } from './icons/ArrowPathIcon';

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
            parts.push(<strong key={`strong-${key++}`} className="font-bold text-cyan-300">{match[1]}</strong>);
            lastIndex = regex.lastIndex;
        }

        if (lastIndex < text.length) {
            parts.push(text.substring(lastIndex));
        }

        return <>{parts}</>;
    };

    // Pre-process text to normalize different AI output formats into one consistent format.
    const cleanedText = text
        // 1. Join description lines (like "- Details...") onto their parent line.
        .replace(/\n\s*-\s/g, ' - ')
        // 2. Correct malformed bolding like **text* -> **text**
        .replace(/\*{2,}(.*?)\*/g, '**$1**')
        // 3. Ensure list items that start with ** also get a * prefix to be parsed as a list.
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
            elements.push(<h3 key={`h-${index}`} className="text-xl font-semibold text-white mt-6 mb-3">{trimmedLine.substring(4)}</h3>);
        } else if (trimmedLine.startsWith('* ')) {
            const content = trimmedLine.substring(2);
            currentListItems.push(<li key={`li-${index}`}>{renderInlineMarkdown(content)}</li>);
        } else {
            flushList();
            // Treat as a heading if it's short, not punctuated, and likely a title.
            const isHeading = trimmedLine.length < 50 && !trimmedLine.endsWith('.') && !trimmedLine.endsWith(':');
            if (isHeading) {
                 elements.push(<h3 key={`h-${index}`} className="text-xl font-semibold text-white mt-6 mb-3">{trimmedLine}</h3>);
            } else {
                 elements.push(<p key={`p-${index}`} className="mb-3 leading-relaxed">{renderInlineMarkdown(trimmedLine)}</p>);
            }
        }
    });

    flushList();
    return <>{elements}</>;
};

export const MarketPulseView: React.FC = () => {
    const { pulse, loading, errors, refreshPulse } = useMarketIntel();
    const { apiKey, openKeyModal } = useApiKey();

    const renderContent = () => {
        if (loading.pulse) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <LoadingSpinner />
                    <p className="mt-4 text-slate-300">Analyzing the market... this may take a moment.</p>
                </div>
            );
        }

        if (errors.pulse) {
            return (
                 <div className="max-w-2xl mx-auto text-center">
                    <div className="p-6 bg-red-900/20 border border-red-500/30 rounded-lg">
                        <ExclamationTriangleIcon className="w-12 h-12 mx-auto text-red-400" />
                        <h2 className="mt-4 text-2xl font-bold text-white">Failed to Get Pulse</h2>
                        <p className="mt-2 text-red-300">{errors.pulse}</p>
                    </div>
                    <button onClick={refreshPulse} className="mt-6 px-6 py-2 bg-slate-700 text-slate-200 font-semibold rounded-lg hover:bg-slate-600">
                        Try Again
                    </button>
                     {!apiKey && (
                         <button onClick={openKeyModal} className="mt-4 text-sm text-cyan-400 underline hover:text-cyan-300">
                            Set API Key
                        </button>
                    )}
                </div>
            )
        }
        
        if (pulse.content) {
             return (
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 shadow-sm animate-[fade-in_0.5s]">
                    <div className="prose prose-invert max-w-none text-slate-300">
                        <FormattedContent text={pulse.content} />
                    </div>
                </div>
            );
        }

        // Initial state before anything has loaded
        return null;
    }


    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">Market Pulse</h1>
                    <p className="text-slate-400">A real-time, AI-powered briefing on the current state of the forex market.</p>
                    {pulse.lastUpdated && !loading.pulse && (
                        <p className="text-slate-500 text-sm mt-1">
                            Last updated: {pulse.lastUpdated.toLocaleTimeString()}
                        </p>
                    )}
                </div>
                 <button 
                    onClick={refreshPulse} 
                    className="mt-4 sm:mt-0 flex items-center px-4 py-2 bg-slate-700 text-slate-200 font-semibold rounded-lg hover:bg-slate-600 transition-colors"
                    disabled={loading.pulse}
                >
                    <ArrowPathIcon className={`w-5 h-5 mr-2 ${loading.pulse ? 'animate-spin' : ''}`} />
                    Refresh Pulse
                </button>
            </div>
            
            {renderContent()}

            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    );
};