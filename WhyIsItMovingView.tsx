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
            parts.push(<strong key={`strong-${key++}`} className="font-bold text-cyan-400">{match[1]}</strong>);
            lastIndex = regex.lastIndex;
        }

        if (lastIndex < text.length) {
            parts.push(text.substring(lastIndex));
        }

        return <>{parts}</>;
    };

    const blocks = text.split(/\n\s*\n/).filter(block => block.trim());

    return (
        <>
            {blocks.map((block, index) => {
                const trimmedBlock = block.trim();

                // Handle titles like "### Title" or "1. Title"
                if (trimmedBlock.startsWith('### ') || /^\d+\.\s/.test(trimmedBlock)) {
                    return <h3 key={index} className="text-xl font-semibold text-white mt-6 mb-3">{renderInlineMarkdown(trimmedBlock.replace(/^###\s|^\d+\.\s/, ''))}</h3>;
                }
                
                // Handle list items
                if (/^\s*[\*\-]\s/.test(trimmedBlock)) {
                    const lines = trimmedBlock.split('\n');
                    
                    return (
                        <ul key={index} className="list-disc space-y-2 my-4 pl-6">
                            {lines.map((line, lineIndex) => {
                                const content = line.replace(/^\s*[\*\-]\s/, '');
                                if (!content.trim()) return null;
                                return <li key={lineIndex}>{renderInlineMarkdown(content)}</li>
                            })}
                        </ul>
                    );
                }

                // Handle headings that are just bolded text, optionally followed by a colon
                if (trimmedBlock.startsWith('**') && trimmedBlock.endsWith('**') || (trimmedBlock.startsWith('**') && trimmedBlock.includes('**:'))) {
                     // Check if it's the ONLY thing on the line, to treat it as a heading
                    const isHeadingLike = !trimmedBlock.includes('\n');
                    if(isHeadingLike) {
                        return <h3 className="text-xl font-semibold text-white mt-6 mb-3">{renderInlineMarkdown(trimmedBlock)}</h3>
                    }
                }
                
                return <p key={index} className="mb-4 leading-relaxed">{renderInlineMarkdown(trimmedBlock)}</p>;
            })}
        </>
    );
};

interface WhyIsItMovingViewProps {
    initialPair?: string;
}

export const WhyIsItMovingView: React.FC<WhyIsItMovingViewProps> = ({ initialPair }) => {
    const [selectedPair, setSelectedPair] = useState<string | null>(initialPair || null);
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
        if (initialPair) {
            setSelectedPair(initialPair);
        }
    }, [initialPair]);

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
        <div className="text-center py-12 bg-slate-800/30 border-2 border-dashed border-slate-700 rounded-lg">
            <MagnifyingGlassChartIcon className="w-16 h-16 mx-auto text-slate-500 mb-4" />
            <h2 className="text-2xl font-bold text-white">Live Market Analyzer</h2>
            <p className="text-slate-400 mt-2 max-w-md mx-auto">Select a currency pair to get an instant, AI-powered analysis on why it's moving right now.</p>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">Why Is It Moving?</h1>
            <p className="text-slate-400 mb-8">Get a real-time summary of the catalysts driving market price action.</p>

            <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg mb-8 shadow-sm">
                <label htmlFor="currency-pair" className="block text-sm font-medium text-slate-300 mb-2">
                    Select Currency Pair for Live Analysis
                </label>
                <select
                    id="currency-pair"
                    value={selectedPair ?? ''}
                    onChange={(e) => setSelectedPair(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white font-semibold focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
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
                    <p className="mt-4 text-slate-300">AI is analyzing recent market events for {debouncedSelectedPair}...</p>
                </div>
            )}
            
            {error && !isLoading && (
                 <div className="p-6 bg-red-900/20 border border-red-500/30 rounded-lg animate-[fade-in_0.3s]">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-300">Analysis Failed</h3>
                            <div className="mt-2 text-sm text-red-400">
                                <p>{error}</p>
                            </div>
                            <div className="mt-4">
                                <button
                                    onClick={() => handleAnalyze(selectedPair!)}
                                    disabled={!selectedPair}
                                    className="px-4 py-1.5 bg-red-500/20 text-red-300 text-sm font-semibold rounded-md hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Try Again
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!selectedPair && !isLoading && !error && <WelcomeScreen />}

            {analysis && !isLoading && !error && (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-sm animate-[fade-in_0.5s]">
                    <div className="prose prose-invert prose-lg max-w-none text-slate-300">
                        <FormattedContent text={analysis} />
                    </div>
                    {sources.length > 0 && (
                        <div className="mt-8 pt-6 border-t border-slate-700">
                            <h4 className="text-lg font-semibold text-slate-300 mb-3 flex items-center">
                                <LinkIcon className="w-5 h-5 mr-2 text-slate-400" /> Sources
                            </h4>
                            <ul className="space-y-2">
                                {sources.map((chunk, index) => chunk.web && (
                                    <li key={index} className="text-sm text-slate-400">
                                        <a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 underline flex items-start gap-2" title={chunk.web.title}>
                                           <span className="flex-shrink-0 mt-1">&#8227;</span>
                                           <span className="truncate">{chunk.web.title}</span>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
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