import React, { useState } from 'react';
import { generateMarketPulse } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { SignalIcon } from './icons/SignalIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';
import { useApiKey } from '../hooks/useApiKey';

const FormattedContent: React.FC<{ text: string }> = ({ text }) => {
    const renderInlineMarkdown = (lineText: string): React.ReactNode => {
        return lineText.split(/(\*\*.*?\*\*)/g).map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-bold text-cyan-300">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    const sections = text.split(/^(###\s.*$)/m).filter(Boolean);
    const elements: React.ReactElement[] = [];

    for (let i = 0; i < sections.length; i += 2) {
        const title = sections[i].replace('### ', '').trim();
        const content = sections[i + 1] || '';
        const lines = content.split('\n').filter(p => p.trim() !== '');
        
        elements.push(<h3 key={`h-${i}`} className="text-xl font-semibold text-white mt-6 mb-3">{title}</h3>);

        let listItems: React.ReactElement[] = [];
        const flushListItems = () => {
            if (listItems.length > 0) {
                elements.push(<ul key={`ul-${i}-${elements.length}`} className="list-disc space-y-2 my-3 pl-6">{listItems}</ul>);
                listItems = [];
            }
        };

        lines.forEach((line, index) => {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('*')) {
                listItems.push(<li key={`li-${i}-${index}`}>{renderInlineMarkdown(trimmedLine.substring(1).trim())}</li>);
            } else {
                flushListItems();
                elements.push(<p key={`p-${i}-${index}`} className="mb-3 leading-relaxed">{renderInlineMarkdown(trimmedLine)}</p>);
            }
        });
        flushListItems();
    }

    return <>{elements}</>;
};

export const MarketPulseView: React.FC = () => {
    const [pulseData, setPulseData] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const { apiKey, openKeyModal } = useApiKey();

    const handleGetPulse = async () => {
        if (!apiKey) {
            setError('Please provide an API key to get the market pulse.');
            openKeyModal();
            return;
        }
        setIsLoading(true);
        setError(null);
        setPulseData('');
        try {
            const data = await generateMarketPulse(apiKey);
            setPulseData(data);
        } catch (e) {
            console.error(e);
            setError('Failed to fetch market pulse. Please check your API key and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">Market Pulse</h1>
            <p className="text-gray-400 mb-8">Get a real-time, AI-powered briefing on the current state of the forex market.</p>

            {!pulseData && !isLoading && !error && (
                <div className="text-center py-12">
                    <button 
                        onClick={handleGetPulse}
                        className="inline-flex items-center px-8 py-4 bg-cyan-500 text-gray-900 font-bold text-xl rounded-lg shadow-md hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 transition-all duration-200"
                    >
                        <SignalIcon className="w-7 h-7 mr-3" />
                        Get Today's Market Pulse
                    </button>
                </div>
            )}
            
            {isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <LoadingSpinner />
                    <p className="mt-4 text-gray-300">Analyzing the market... this may take a moment.</p>
                </div>
            )}
            
            {error && (
                <div className="max-w-2xl mx-auto text-center">
                    <div className="p-6 bg-red-900/20 border border-red-500/30 rounded-lg">
                        <ExclamationTriangleIcon className="w-12 h-12 mx-auto text-red-400" />
                        <h2 className="mt-4 text-2xl font-bold text-white">Failed to Get Pulse</h2>
                        <p className="mt-2 text-red-300">{error}</p>
                    </div>
                    <button onClick={handleGetPulse} className="mt-6 px-6 py-2 bg-gray-700 text-gray-200 font-semibold rounded-lg hover:bg-gray-600">
                        Try Again
                    </button>
                </div>
            )}

            {pulseData && (
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 animate-[fade-in_0.5s]">
                    <div className="prose prose-invert prose-lg max-w-none text-gray-300">
                        <FormattedContent text={pulseData} />
                    </div>
                     <button onClick={handleGetPulse} className="mt-8 inline-flex items-center px-6 py-2 bg-gray-700 text-gray-200 font-semibold rounded-lg shadow-sm hover:bg-gray-600">
                        <SignalIcon className="w-5 h-5 mr-2" />
                        Refresh Pulse
                    </button>
                </div>
            )}

            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    );
};
