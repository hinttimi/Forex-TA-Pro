

import React, { useState, useEffect, useCallback } from 'react';
import { analyzePriceMovement } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { MagnifyingGlassChartIcon } from './icons/MagnifyingGlassChartIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';
import { LinkIcon } from './icons/LinkIcon';
import { useDebounce } from '../../hooks/useDebounce';
import { useApiKey } from '../hooks/useApiKey';

const MAJOR_PAIRS = ['AUD/USD', 'EUR/USD', 'GBP/USD', 'NZD/USD', 'USD/CAD', 'USD/CHF', 'USD/JPY', 'XAU/USD'].sort();

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

    const lines = text.split('\n').filter(line => line.trim() !== '');
    const elements: React.ReactElement[] = [];
    let currentListItems: React.ReactElement[] = [];

    const flushList = () => {
        if (currentListItems.length > 0) {
            elements.push(<ul key={`ul-${elements.length}`} className="list-disc space-y-2 my-3 pl-6">{currentListItems}</ul>);
            currentListItems = [];
        }
    };

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        
        // Differentiate between a heading (*Title*) and a list item (* item)
        const isListItem = trimmedLine.startsWith('* ');
        const isHeading = trimmedLine.startsWith('*') && !isListItem;

        if (isHeading) {
            flushList();
            // This is a more complex heading that might have content on the same line.
            // Example: `*Primary Driver:* **Some text here.**`
            // We find the title part and the content part.
            
            // The title is the text between the first '*' and the first ':' or the last '*'.
            const titleEndMarker = trimmedLine.indexOf(':') > 0 ? trimmedLine.indexOf(':') : trimmedLine.lastIndexOf('*');
            
            if (titleEndMarker > 1) {
                const title = trimmedLine.substring(1, titleEndMarker).trim();
                const content = trimmedLine.substring(titleEndMarker + 1).trim();
                
                elements.push(<h3 key={`h-${index}`} className="text-xl font-semibold text-white mt-6 mb-3">{renderInlineMarkdown(title)}</h3>);
                if (content) {
                    elements.push(<p key={`p-content-${index}`} className="mb-3 leading-relaxed">{renderInlineMarkdown(content)}</p>);
                }
            } else {
                 // Fallback for lines that start with * but don't fit the pattern, like `***`
                 elements.push(<p key={`p-fallback-${index}`} className="mb-3 leading-relaxed">{renderInlineMarkdown(trimmedLine)}</p>);
            }
        } else if (isListItem) {
            const content = trimmedLine.substring(2);
            currentListItems.push(<li key={`li-${index}`}>{renderInlineMarkdown(content)}</li>);
        } else {
            flushList();
            elements.push(<p key={`p-${index}`} className="mb-3 leading-relaxed">{renderInlineMarkdown(trimmedLine)}</p>);
        }
    });

    flushList();
    return <>{elements}</>;
};


export const WhyIsItMovingView: React.FC = () => {
    const [selectedPair, setSelectedPair] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<string>('');
    const [sources, setSources] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const { apiKey, openKeyModal } = useApiKey();

    const debouncedSelectedPair = useDebounce(selectedPair, 500);

    const handleAnalyze = useCallback(async (pair: string) => {
        if (!apiKey) {
            setError('Please provide an API key to analyze the market.');
            openKeyModal();
            return;
        }
        setIsLoading(true);
        setError(null);
        setAnalysis('');
        setSources([]);
        try {
            const { analysis: fetchedAnalysis, sources: fetchedSources } = await analyzePriceMovement(apiKey, pair);
            setAnalysis(fetchedAnalysis);
            setSources(fetchedSources);
        } catch (e) {
            console.error(e);
            setError(`Failed to analyze ${pair}. Please check your API key and try again.`);
        } finally {
            setIsLoading(false);
        }
    }, [apiKey, openKeyModal]);

    useEffect(() => {
        if (debouncedSelectedPair) {
            handleAnalyze(debouncedSelectedPair);
        } else {
            setAnalysis('');
            setSources([]);
            setError(null);
            setIsLoading(false);
        }
    }, [debouncedSelectedPair, handleAnalyze]);

    const WelcomeScreen = () => (
        <div className="text-center py-12 bg-gray-800/30 border border-dashed border-gray-700 rounded-lg">
            <MagnifyingGlassChartIcon className="w-16 h-16 mx-auto text-gray-500 mb-4" />
            <h2 className="text-2xl font-bold text-white">Live Market Analyzer</h2>
            <p className="text-gray-400 mt-2 max-w-md mx-auto">Select a currency pair to get an instant, AI-powered analysis on why it's moving right now.</p>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">Why Is It Moving?</h1>
            <p className="text-gray-400 mb-8">Get a real-time summary of the catalysts driving market price action.</p>

            <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg mb-8">
                <label htmlFor="currency-pair" className="block text-sm font-medium text-gray-300 mb-2">
                    Select Currency Pair for Live Analysis
                </label>
                <select
                    id="currency-pair"
                    value={selectedPair ?? ''}
                    onChange={(e) => setSelectedPair(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white font-semibold focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                >
                    <option value="" disabled>-- Select a pair --</option>
                    {MAJOR_PAIRS.map(pair => (
                        <option key={pair} value={pair}>{pair}</option>
                    ))}
                </select>
            </div>

            {isLoading && (
                <div className="flex flex-col items-center justify-center text-center py-12">
                    <LoadingSpinner />
                    <p className="mt-4 text-gray-300">AI is analyzing recent market events for {debouncedSelectedPair}...</p>
                </div>
            )}
            
            {error && !isLoading && (
                <div className="p-6 bg-red-900/20 border border-red-500/30 rounded-lg animate-[fade-in_0.3s]">
                    <div className="flex">
                        <div className="flex-shrink-0">
                             <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-lg font-medium text-red-300">Analysis Failed</h3>
                            <div className="mt-2 text-sm text-red-400">
                                <p>{error}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!selectedPair && !isLoading && !error && <WelcomeScreen />}
            
            {analysis && !isLoading && (
                 <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 animate-[fade-in_0.5s]">
                    <div className="prose prose-invert prose-lg max-w-none text-gray-300">
                        <FormattedContent text={analysis} />
                    </div>
                    {sources.length > 0 && (
                        <div className="mt-8 pt-6 border-t border-gray-700">
                             <h4 className="text-lg font-semibold text-gray-300 mb-3 flex items-center">
                                <LinkIcon className="w-5 h-5 mr-2" />
                                Sources
                             </h4>
                             <ul className="list-disc list-inside space-y-2">
                                 {sources.map((chunk, index) => chunk.web && (
                                    <li key={index} className="text-sm text-gray-400">
                                        <a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 underline" title={chunk.web.title}>
                                           {chunk.web.title || chunk.web.uri}
                                        </a>
                                    </li>
                                 ))}
                             </ul>
                        </div>
                    )}
                </div>
            )}
            <style>{`@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }`}</style>
        </div>
    );
};