
import React, { useState } from 'react';
import { parseStrategyFromText, generateSimulatedBacktestResults, analyzeBacktestResults } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { SparklesIcon } from './icons/SparklesIcon';
import { BeakerIcon } from './icons/BeakerIcon';
import { useApiKey } from '../hooks/useApiKey';
import { StrategyParams, BacktestResults } from '../types';

const MAJOR_PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CAD', 'AUD/USD', 'NZD/USD', 'USD/CHF'];
const TIMEFRAMES = ['1M', '5M', '15M', '1H', '4H', 'Daily'];
const PERIODS = ['Last Month', 'Last 3 Months', 'Last 6 Months', 'Last Year'];

const FormattedContent: React.FC<{ text: string }> = ({ text }) => {
    const lines = text.split('\n').filter(p => p.trim() !== '');
    const renderInlineMarkdown = (lineText: string) => lineText.split(/\*\*(.*?)\*\*/g).map((part, i) =>
        i % 2 === 1 ? <strong key={i} className="font-bold text-cyan-300">{part}</strong> : part
    );
    const elements: React.ReactElement[] = [];
    let listItems: React.ReactElement[] = [];

    const flushListItems = () => {
        if (listItems.length > 0) {
            elements.push(<ul key={`ul-${elements.length}`} className="list-disc space-y-2 my-3 pl-5">{listItems}</ul>);
            listItems = [];
        }
    };

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        const isListItem = /^\s*[\*\-]\s/.test(trimmedLine);
        const isHeading = /^\d+\.\s/.test(trimmedLine);

        if (isListItem) {
            listItems.push(<li key={index}>{renderInlineMarkdown(trimmedLine.replace(/^\s*[\*\-]\s/, ''))}</li>);
        } else {
            flushListItems();
            if (isHeading) {
                 elements.push(<h4 key={index} className="text-lg font-semibold text-white mt-4 mb-2">{renderInlineMarkdown(trimmedLine.replace(/^\d+\.\s/, ''))}</h4>);
            } else {
                elements.push(<p key={index} className="mb-3 leading-relaxed">{renderInlineMarkdown(trimmedLine)}</p>);
            }
        }
    });
    flushListItems();
    return <>{elements}</>;
};

const MetricCard: React.FC<{ label: string; value: string; className?: string }> = ({ label, value, className }) => (
    <div className={`bg-gray-800/60 p-4 rounded-lg ${className}`}>
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
    </div>
);

type LabState = 'idle' | 'parsing' | 'simulating' | 'analyzing' | 'results' | 'error';

export const AIBacktesterView: React.FC = () => {
    const [strategyText, setStrategyText] = useState('');
    const [pair, setPair] = useState('EUR/USD');
    const [timeframe, setTimeframe] = useState('15M');
    const [period, setPeriod] = useState('Last 3 Months');
    
    const [state, setState] = useState<LabState>('idle');
    const [error, setError] = useState('');

    const [parsedStrategy, setParsedStrategy] = useState<StrategyParams | null>(null);
    const [backtestResults, setBacktestResults] = useState<BacktestResults | null>(null);
    const [coachingAnalysis, setCoachingAnalysis] = useState<string>('');

    const { apiKey, openKeyModal } = useApiKey();

    const handleStartAnalysis = async () => {
        if (!apiKey) {
            setError("Please set your Gemini API key to use the Strategy Lab.");
            openKeyModal();
            return;
        }
        if (!strategyText.trim()) {
            setError("Please describe your trading strategy.");
            return;
        }

        setError('');
        setParsedStrategy(null);
        setBacktestResults(null);
        setCoachingAnalysis('');

        try {
            // Step 1: Parse Strategy
            setState('parsing');
            const parsed = await parseStrategyFromText(apiKey, strategyText, pair, timeframe);
            setParsedStrategy(parsed);

            // Step 2: Simulate Backtest
            setState('simulating');
            const results = await generateSimulatedBacktestResults(apiKey, parsed, period);
            setBacktestResults(results);

            // Step 3: Get Coaching Analysis
            setState('analyzing');
            const analysis = await analyzeBacktestResults(apiKey, parsed, results);
            setCoachingAnalysis(analysis);

            setState('results');

        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : "An unknown error occurred during analysis.");
            setState('error');
        }
    };
    
    const getLoadingMessage = () => {
        switch(state) {
            case 'parsing': return "AI is understanding your strategy...";
            case 'simulating': return "Running plausible simulation...";
            case 'analyzing': return "Generating coaching feedback...";
            default: return "";
        }
    };

    const handleReset = () => {
        setState('idle');
        setError('');
        setParsedStrategy(null);
        setBacktestResults(null);
        setCoachingAnalysis('');
    };
    
    const WelcomeScreen = () => (
         <div className="text-center">
            <BeakerIcon className="w-16 h-16 mx-auto text-cyan-400" />
            <h2 className="mt-4 text-3xl font-bold text-white">AI Strategy Lab</h2>
            <p className="mt-2 text-lg text-gray-400 max-w-2xl mx-auto">Describe your strategy, and let the AI simulate its performance and give you expert coaching.</p>
        </div>
    );
    
    return (
        <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">AI Strategy Lab</h1>
            <p className="text-gray-400 mb-8">Design, test, and refine your trading strategies using natural language.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* --- Left Panel: Input --- */}
                <div className="space-y-6">
                    <div>
                        <label htmlFor="strategyText" className="block text-lg font-semibold text-white mb-2">1. Describe Your Trading Strategy</label>
                        <textarea
                            id="strategyText"
                            value={strategyText}
                            onChange={e => setStrategyText(e.target.value)}
                            placeholder='e.g., "Enter short when price sweeps a major high then breaks the last low. Place stop loss above the sweep and target a 1:3 RR."'
                            rows={8}
                            className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                        />
                    </div>
                    <div>
                         <label className="block text-lg font-semibold text-white mb-2">2. Set Your Parameters</label>
                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <select value={pair} onChange={e => setPair(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white font-semibold focus:ring-2 focus:ring-cyan-500">
                                {MAJOR_PAIRS.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                             <select value={timeframe} onChange={e => setTimeframe(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white font-semibold focus:ring-2 focus:ring-cyan-500">
                                {TIMEFRAMES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                             <select value={period} onChange={e => setPeriod(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white font-semibold focus:ring-2 focus:ring-cyan-500">
                                {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                         </div>
                    </div>
                    <button
                        onClick={handleStartAnalysis}
                        disabled={state !== 'idle' && state !== 'error'}
                        className="w-full py-3 bg-cyan-500 text-gray-900 font-bold rounded-lg shadow-md hover:bg-cyan-400 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        <SparklesIcon className="w-6 h-6 mr-2" />
                        Analyze Strategy
                    </button>
                </div>
                {/* --- Right Panel: Results --- */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 min-h-[400px] flex flex-col">
                    {(state === 'idle') && <WelcomeScreen />}
                    
                    {(state === 'parsing' || state === 'simulating' || state === 'analyzing') && (
                        <div className="m-auto text-center">
                            <LoadingSpinner />
                            <p className="mt-3 text-gray-400">{getLoadingMessage()}</p>
                        </div>
                    )}
                    
                    {state === 'error' && (
                         <div className="m-auto text-center">
                            <p className="text-red-400 bg-red-500/10 p-4 rounded-md">{error}</p>
                            <button onClick={handleReset} className="mt-4 px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500">Try Again</button>
                         </div>
                    )}
                    
                    {state === 'results' && backtestResults && coachingAnalysis && (
                        <div className="animate-[fade-in_0.5s] space-y-6">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-3">Plausible Performance Report</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-center">
                                    <MetricCard label="Win Rate" value={`${backtestResults.winRate.toFixed(1)}%`} />
                                    <MetricCard label="Profit Factor" value={backtestResults.profitFactor.toFixed(2)} />
                                    <MetricCard label="Avg. R:R" value={`1:${backtestResults.avgRR.toFixed(2)}`} />
                                    <MetricCard label="Total Trades" value={String(backtestResults.totalTrades)} />
                                    <MetricCard label="Max Drawdown" value={`${backtestResults.maxDrawdown.toFixed(1)}%`} />
                                </div>
                            </div>
                            <div className="pt-6 border-t border-gray-700">
                                 <h3 className="text-xl font-bold text-white mb-3">AI Coaching Analysis</h3>
                                 <div className="prose prose-invert prose-sm max-w-none text-gray-300">
                                    <FormattedContent text={coachingAnalysis} />
                                 </div>
                            </div>
                             <button onClick={handleReset} className="w-full mt-4 py-2 bg-gray-600 font-semibold rounded-md hover:bg-gray-500">Test Another Strategy</button>
                        </div>
                    )}
                </div>
            </div>
             <style>{`@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }`}</style>
        </div>
    );
};
