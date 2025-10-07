import React, { useState } from 'react';
import { analyzePriceMovement } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { MagnifyingGlassChartIcon } from './icons/MagnifyingGlassChartIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';
import { LinkIcon } from './icons/LinkIcon';

const MAJOR_PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CAD', 'AUD/USD', 'NZD/USD', 'USD/CHF'];

const FormattedContent: React.FC<{ text: string }> = ({ text }) => {
    const renderInlineMarkdown = (lineText: string): React.ReactNode => {
        return lineText.split(/(\*\*.*?\*\*)/g).map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-bold text-cyan-300">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    const lines = text.split('\n').filter(p => p.trim() !== '');
    const elements: React.ReactElement[] = [];
    let listItems: React.ReactElement[] = [];

    const flushListItems = () => {
        if (listItems.length > 0) {
            elements.push(<ul key={`ul-${elements.length}`} className="list-disc space-y-2 my-3 pl-6">{listItems}</ul>);
            listItems = [];
        }
    };

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('*')) {
            listItems.push(<li key={`li-${index}`}>{renderInlineMarkdown(trimmedLine.substring(1).trim())}</li>);
        } else {
            flushListItems();
            const isHeading = /^\d+\.\s/.test(trimmedLine);
            if (isHeading) {
                const headingText = trimmedLine.substring(trimmedLine.indexOf(' ') + 1);
                elements.push(<h3 key={`h-${index}`} className="text-xl font-semibold text-white mt-5 mb-2">{renderInlineMarkdown(headingText)}</h3>);
            } else {
                 elements.push(<p key={`p-${index}`} className="mb-3 leading-relaxed">{renderInlineMarkdown(trimmedLine)}</p>);
            }
        }
    });
    flushListItems();

    return <>{elements}</>;
};

export const WhyIsItMovingView: React.FC = () => {
    const [selectedPair, setSelectedPair] = useState(MAJOR_PAIRS[0]);
    const [analysis, setAnalysis] = useState<string>('');
    const [sources, setSources] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async () => {
        setIsLoading(true);
        setError(null);
        setAnalysis('');
        setSources([]);
        try {
            const { analysis: fetchedAnalysis, sources: fetchedSources } = await analyzePriceMovement(selectedPair);
            setAnalysis(fetchedAnalysis);
            setSources(fetchedSources);
        } catch (e) {
            console.error(e);
            setError(`Failed to analyze ${selectedPair}. The AI may be busy, or there could be an issue with your connection or API key.`);
        } finally {
            setIsLoading(false);
        }
    };

    const WelcomeScreen = () => (
        <div className="text-center py-12 bg-gray-800/30 border border-dashed border-gray-700 rounded-lg">
            <MagnifyingGlassChartIcon className="w-16 h-16 mx-auto text-gray-500 mb-4" />
            <h2 className="text-2xl font-bold text-white">Market Analyzer</h2>
            <p className="text-gray-400 mt-2 max-w-md mx-auto">Select a currency pair and get an instant, AI-powered analysis on why it's moving right now.</p>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">Why Is It Moving?</h1>
            <p className="text-gray-400 mb-8">Get a real-time summary of the catalysts driving market price action.</p>

            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-gray-800/50 border border-gray-700 rounded-lg mb-8">
                <div className="flex-grow w-full sm:w-auto">
                    <label htmlFor="currency-pair" className="sr-only">Select Currency Pair</label>
                    <select
                        id="currency-pair"
                        value={selectedPair}
                        onChange={(e) => setSelectedPair(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white font-semibold focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                        disabled={isLoading}
                    >
                        {MAJOR_PAIRS.map(pair => (
                            <option key={pair} value={pair}>{pair}</option>
                        ))}
                    </select>
                </div>
                <button
                    onClick={handleAnalyze}
                    disabled={isLoading}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2 bg-cyan-500 text-gray-900 font-bold rounded-lg shadow-md hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 transition-all duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    {isLoading ? <LoadingSpinner /> : <MagnifyingGlassChartIcon className="w-5 h-5 mr-2" />}
                    {isLoading ? 'Analyzing...' : 'Analyze Now'}
                </button>
            </div>

            {isLoading && (
                <div className="flex flex-col items-center justify-center text-center py-12">
                    <LoadingSpinner />
                    <p className="mt-4 text-gray-300">AI is analyzing recent market events for {selectedPair}...</p>
                </div>
            )}
            
            {error && (
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

            {!analysis && !isLoading && !error && <WelcomeScreen />}
            
            {analysis && (
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