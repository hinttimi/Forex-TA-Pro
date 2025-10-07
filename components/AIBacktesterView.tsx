import React, { useState, useRef, useEffect } from 'react';
import { analyzeBacktestResults } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { BeakerIcon } from './icons/BeakerIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';

// --- Types ---
type BacktestState = 'idle' | 'running' | 'analyzing' | 'results' | 'error';

interface StrategyParams {
    pair: string;
    timeframe: string;
    entryCriteria: string[];
    stopLoss: string;
    takeProfit: string;
}

interface BacktestResults {
    totalTrades: number;
    winRate: number;
    profitFactor: number;
    avgRR: number;
    tradeLog: { outcome: 'Win' | 'Loss', rr: number }[];
}

// --- Constants ---
const PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD'];
const TIMEFRAMES = ['15 Minute', '1 Hour', '4 Hour'];
const ENTRY_CRITERIA = ['Liquidity Sweep', 'Change of Character (CHoCH)', 'Entry on Order Block', 'Entry on FVG', 'In Premium/Discount Zone'];
const STOP_LOSS_OPTIONS = ['Below/Above Swing Low/High', 'Fixed Pips (20)'];
const TAKE_PROFIT_OPTIONS = ['Fixed 1:2 R:R', 'Fixed 1:3 R:R', 'Target Opposing Liquidity'];

// --- Mock Backtesting Function ---
const runMockBacktest = (params: StrategyParams): Promise<BacktestResults> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const totalTrades = Math.floor(Math.random() * 80) + 20; // 20-100 trades
            let wins = 0;
            const tradeLog: { outcome: 'Win' | 'Loss', rr: number }[] = [];
            
            // Influence win rate by criteria. More criteria = slightly higher win rate.
            const baseWinRate = 0.35 + (params.entryCriteria.length * 0.04);
            const rrValue = params.takeProfit.includes('1:2') ? 2 : (params.takeProfit.includes('1:3') ? 3 : 2.5);

            for (let i = 0; i < totalTrades; i++) {
                if (Math.random() < baseWinRate) {
                    wins++;
                    tradeLog.push({ outcome: 'Win', rr: rrValue });
                } else {
                    tradeLog.push({ outcome: 'Loss', rr: 1 });
                }
            }

            const winRate = (wins / totalTrades) * 100;
            const totalGain = wins * rrValue;
            const totalLoss = (totalTrades - wins) * 1;
            const profitFactor = totalLoss > 0 ? totalGain / totalLoss : totalGain;
            
            resolve({
                totalTrades,
                winRate: parseFloat(winRate.toFixed(2)),
                profitFactor: parseFloat(profitFactor.toFixed(2)),
                avgRR: rrValue,
                tradeLog
            });
        }, 1500); // Simulate network/computation time
    });
};

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
            elements.push(<ul key={`ul-${elements.length}`} className="list-disc space-y-2 my-3 pl-5">{listItems}</ul>);
            listItems = [];
        }
    };

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        const isHeading = /^\d+\.\s/.test(trimmedLine);

        if (trimmedLine.startsWith('*')) {
            listItems.push(<li key={`li-${index}`}>{renderInlineMarkdown(trimmedLine.substring(1).trim())}</li>);
        } else if (isHeading) {
            flushListItems();
            const headingText = trimmedLine.substring(trimmedLine.indexOf(' ') + 1);
            elements.push(<h3 key={`h-${index}`} className="text-lg font-semibold text-white mt-4 mb-2">{renderInlineMarkdown(headingText)}</h3>);
        } else {
            flushListItems();
            elements.push(<p key={`p-${index}`} className="mb-3 leading-relaxed">{renderInlineMarkdown(trimmedLine)}</p>);
        }
    });
    flushListItems();

    return <>{elements}</>;
};

// --- Main Component ---
export const AIBacktesterView: React.FC = () => {
    const [strategy, setStrategy] = useState<StrategyParams>({
        pair: PAIRS[0],
        timeframe: TIMEFRAMES[0],
        entryCriteria: [ENTRY_CRITERIA[0], ENTRY_CRITERIA[1], ENTRY_CRITERIA[2]],
        stopLoss: STOP_LOSS_OPTIONS[0],
        takeProfit: TAKE_PROFIT_OPTIONS[1],
    });
    const [state, setState] = useState<BacktestState>('idle');
    const [results, setResults] = useState<BacktestResults | null>(null);
    const [analysis, setAnalysis] = useState<string>('');
    const [error, setError] = useState<string>('');

    const chartRef = useRef<HTMLCanvasElement>(null);

    const handleCriteriaChange = (criteria: string) => {
        setStrategy(prev => {
            const newCriteria = prev.entryCriteria.includes(criteria)
                ? prev.entryCriteria.filter(c => c !== criteria)
                : [...prev.entryCriteria, criteria];
            return { ...prev, entryCriteria: newCriteria };
        });
    };

    const handleRunTest = async () => {
        if (strategy.entryCriteria.length === 0) {
            setError("Please select at least one entry criterion.");
            return;
        }
        setError('');
        setState('running');
        setResults(null);
        setAnalysis('');

        try {
            const backtestResults = await runMockBacktest(strategy);
            setResults(backtestResults);
            setState('analyzing');
            const aiAnalysis = await analyzeBacktestResults(strategy, backtestResults);
            setAnalysis(aiAnalysis);
            setState('results');
        } catch (e) {
            console.error(e);
            setError("An error occurred during the backtest or analysis.");
            setState('error');
        }
    };

    useEffect(() => {
        if (state === 'results' && results && chartRef.current) {
            const canvas = chartRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            let balance = 100000;
            const balanceHistory = results.tradeLog.map(trade => {
                const risk = balance * 0.01; // 1% risk
                balance += trade.outcome === 'Win' ? risk * trade.rr : -risk;
                return balance;
            });

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const PADDING = 40;
            const chartWidth = canvas.width - PADDING * 2;
            const chartHeight = canvas.height - PADDING * 2;
            
            const maxBalance = Math.max(...balanceHistory, 100000);
            const minBalance = Math.min(...balanceHistory, 100000);
            const range = maxBalance - minBalance;

            // Draw axes
            ctx.strokeStyle = '#4b5563';
            ctx.beginPath();
            ctx.moveTo(PADDING, PADDING);
            ctx.lineTo(PADDING, canvas.height - PADDING);
            ctx.lineTo(canvas.width - PADDING, canvas.height - PADDING);
            ctx.stroke();

            // Draw line chart
            ctx.strokeStyle = '#22d3ee';
            ctx.lineWidth = 2;
            ctx.beginPath();
            balanceHistory.forEach((bal, i) => {
                const x = PADDING + (i / (balanceHistory.length - 1)) * chartWidth;
                const y = (canvas.height - PADDING) - ((bal - minBalance) / range) * chartHeight;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();

            // Draw labels
            ctx.fillStyle = '#9ca3af';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(maxBalance.toLocaleString(), PADDING - 10, PADDING);
            ctx.fillText(minBalance.toLocaleString(), PADDING - 10, canvas.height - PADDING);
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText('0', PADDING, canvas.height - PADDING + 5);
            ctx.textAlign = 'right';
            ctx.fillText(results.totalTrades.toString(), canvas.width - PADDING, canvas.height - PADDING + 5);


        }
    }, [state, results]);

    const renderResults = () => {
        if (!results) return null;
        return (
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 animate-[fade-in_0.5s]">
                {/* Stats and Chart */}
                <div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-800 p-4 rounded-lg"><p className="text-sm text-gray-400">Win Rate</p><p className="text-2xl font-bold text-white">{results.winRate}%</p></div>
                        <div className="bg-gray-800 p-4 rounded-lg"><p className="text-sm text-gray-400">Profit Factor</p><p className="text-2xl font-bold text-white">{results.profitFactor}</p></div>
                        <div className="bg-gray-800 p-4 rounded-lg"><p className="text-sm text-gray-400">Total Trades</p><p className="text-2xl font-bold text-white">{results.totalTrades}</p></div>
                        <div className="bg-gray-800 p-4 rounded-lg"><p className="text-sm text-gray-400">Avg. R:R</p><p className="text-2xl font-bold text-white">1:{results.avgRR.toFixed(2)}</p></div>
                    </div>
                    <div className="mt-4 bg-gray-800 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-white mb-2">Equity Curve</h3>
                        <canvas ref={chartRef} width="500" height="250" className="w-full h-auto"></canvas>
                    </div>
                </div>

                {/* AI Analysis */}
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-white mb-3 flex items-center">
                        <SparklesIcon className="w-6 h-6 mr-2 text-cyan-400" />
                        AI Performance Analysis
                    </h3>
                    {state === 'analyzing' ? (
                        <div className="flex items-center space-x-2"><LoadingSpinner /><span className="text-gray-400">AI is analyzing results...</span></div>
                    ) : (
                        <div className="prose prose-invert prose-sm max-w-none text-gray-300">
                           <FormattedContent text={analysis} />
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">AI Strategy Backtester</h1>
            <p className="text-gray-400 mb-8">Define your trading strategy based on SMC principles, run it on historical data, and get AI-powered feedback.</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* --- Configuration Panel --- */}
                <div className="lg:col-span-1 bg-gray-800/50 border border-gray-700 rounded-lg p-6 space-y-6">
                    <div>
                        <h3 className="font-semibold text-white mb-2">Market Context</h3>
                        <div className="space-y-3">
                            <select value={strategy.pair} onChange={e => setStrategy({...strategy, pair: e.target.value})} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white">
                                {PAIRS.map(p => <option key={p}>{p}</option>)}
                            </select>
                            <select value={strategy.timeframe} onChange={e => setStrategy({...strategy, timeframe: e.target.value})} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white">
                                {TIMEFRAMES.map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-white mb-2">Entry Criteria</h3>
                        <div className="space-y-2">
                            {ENTRY_CRITERIA.map(c => (
                                <label key={c} className="flex items-center space-x-3 cursor-pointer">
                                    <input type="checkbox" checked={strategy.entryCriteria.includes(c)} onChange={() => handleCriteriaChange(c)} className="form-checkbox h-4 w-4 bg-gray-700 border-gray-600 rounded text-cyan-500 focus:ring-cyan-600 focus:ring-offset-gray-800" />
                                    <span className="text-gray-300 text-sm">{c}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-white mb-2">Risk Management</h3>
                        <div className="space-y-3">
                            <select value={strategy.stopLoss} onChange={e => setStrategy({...strategy, stopLoss: e.target.value})} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white">
                                {STOP_LOSS_OPTIONS.map(o => <option key={o}>{o}</option>)}
                            </select>
                            <select value={strategy.takeProfit} onChange={e => setStrategy({...strategy, takeProfit: e.target.value})} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white">
                                {TAKE_PROFIT_OPTIONS.map(o => <option key={o}>{o}</option>)}
                            </select>
                        </div>
                    </div>
                     <button onClick={handleRunTest} disabled={state === 'running' || state === 'analyzing'} className="w-full mt-4 py-3 bg-cyan-500 text-gray-900 font-bold rounded-lg shadow-md hover:bg-cyan-400 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center">
                        {state === 'running' || state === 'analyzing' ? <LoadingSpinner /> : <BeakerIcon className="w-5 h-5 mr-2" />}
                        {state === 'running' ? 'Running Test...' : (state === 'analyzing' ? 'Analyzing...' : 'Run Backtest')}
                    </button>
                    {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
                </div>

                {/* --- Results Panel --- */}
                <div className="lg:col-span-2">
                    {state === 'idle' && (
                        <div className="text-center h-full flex flex-col justify-center items-center bg-gray-800/30 border-2 border-dashed border-gray-700 rounded-lg p-12">
                            <BeakerIcon className="w-16 h-16 mx-auto text-gray-500 mb-4" />
                            <h2 className="text-2xl font-bold text-white">Backtest Results Panel</h2>
                            <p className="text-gray-400 mt-2 max-w-md mx-auto">Configure your strategy on the left and run the backtest. Your performance statistics and AI analysis will appear here.</p>
                        </div>
                    )}
                    {(state === 'running' || state === 'analyzing') && (
                        <div className="text-center h-full flex flex-col justify-center items-center bg-gray-800/30 rounded-lg p-12">
                            <LoadingSpinner />
                            <p className="mt-4 text-gray-300">{state === 'running' ? 'Simulating trades on historical data...' : 'AI is analyzing your results...'}</p>
                        </div>
                    )}
                     {state === 'error' && (
                        <div className="p-6 bg-red-900/20 border border-red-500/30 rounded-lg">
                            <div className="flex items-center">
                                <ExclamationTriangleIcon className="h-6 w-6 text-red-400 mr-3" aria-hidden="true" />
                                <div>
                                    <h3 className="text-lg font-medium text-red-300">An Error Occurred</h3>
                                    <p className="mt-1 text-sm text-red-400">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    {state === 'results' && renderResults()}
                </div>
            </div>
            <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                .form-checkbox { appearance: none; -webkit-appearance: none; width: 1rem; height: 1rem; border: 1px solid #4b5563; border-radius: 0.25rem; background-color: #374151; display: inline-block; position: relative; cursor: pointer; }
                .form-checkbox:checked { background-color: #06b6d4; border-color: #0891b2; }
                .form-checkbox:checked::after { content: '✓'; position: absolute; color: #111827; font-size: 0.75rem; line-height: 1rem; top: -1px; left: 2px; }
             `}</style>
        </div>
    );
};
