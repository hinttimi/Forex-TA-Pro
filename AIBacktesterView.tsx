import React, { useState, useRef, useEffect } from 'react';
import { runBacktestOnHistoricalData, parseStrategyFromText, analyzeBacktestResults, analyzeLiveChart, generateSimulatedOhlcData } from '../services/geminiService';
import { MarketDataManager } from '../services/marketDataService';
import { LoadingSpinner } from './LoadingSpinner';
import { SparklesIcon } from './icons/SparklesIcon';
import { BeakerIcon } from './icons/BeakerIcon';
import { useApiKey } from '../hooks/useApiKey';
import { StrategyParams, BacktestResults, AnalysisResult, OhlcData } from '../types';
import { PaperClipIcon } from './icons/PaperClipIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { PhotoIcon } from './icons/PhotoIcon';
import { LinkIcon } from './icons/LinkIcon';
import { OhlcChart } from './OhlcChart';
import { EquityCurveChart } from './EquityCurveChart';

const MAJOR_PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CAD', 'AUD/USD', 'NZD/USD', 'USD/CHF'];
const TIMEFRAMES = ['1M', '5M', '15M', '1H', '4H', 'Daily'];
const PERIODS = ['Last Month', 'Last 3 Months', 'Last 6 Months', 'Last Year'];
const MAX_UPLOADS = 4;

interface UploadedFile {
    data: string; // base64 data without the prefix
    mimeType: string;
    name: string;
}

interface AIBacktesterViewProps {
    initialRequest?: {
        pair: string;
        timeframe: string;
        period: string;
        strategyDescription: string;
    }
}

const readFileAndConvertToBase64 = (file: File): Promise<UploadedFile> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];
        resolve({ data: base64Data, mimeType: file.type, name: file.name });
    };
    reader.onerror = error => reject(error);
  });

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
        const isListItem = /^\s*[\*\-]\s/.test(trimmedLine);
        const isHeading = /^\d+\.\s/.test(trimmedLine) || trimmedLine.startsWith('### ');

        if (isListItem) {
            listItems.push(<li key={index}>{renderInlineMarkdown(trimmedLine.replace(/^\s*[\*\-]\s/, ''))}</li>);
        } else {
            flushListItems();
            if (isHeading) {
                 elements.push(<h4 key={index} className="text-lg font-semibold text-white mt-4 mb-2">{renderInlineMarkdown(trimmedLine.replace(/^\d+\.\s|###\s/, ''))}</h4>);
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

type LabState = 'idle' | 'parsing' | 'fetching_data' | 'generating_simulation_data' | 'analyzing_data' | 'generating_feedback' | 'results' | 'error';
type AnalyzerState = 'idle' | 'analyzing' | 'results' | 'error';
type ActiveTab = 'lab' | 'analyzer';
type ChartTab = 'ohlc' | 'equity';


export const AIBacktesterView: React.FC<AIBacktesterViewProps> = ({ initialRequest }) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('lab');
    const { apiKey, openKeyModal } = useApiKey();

    // --- State for Strategy Lab ---
    const [strategyText, setStrategyText] = useState('');
    const [pair, setPair] = useState('EUR/USD');
    const [timeframe, setTimeframe] = useState('15M');
    const [period, setPeriod] = useState('Last 3 Months');
    const [labState, setLabState] = useState<LabState>('idle');
    const [labError, setLabError] = useState('');
    const [parsedStrategy, setParsedStrategy] = useState<StrategyParams | null>(null);
    const [backtestResults, setBacktestResults] = useState<BacktestResults | null>(null);
    const [coachingAnalysis, setCoachingAnalysis] = useState<string>('');
    const [ohlcData, setOhlcData] = useState<OhlcData[]>([]);
    const [dataSource, setDataSource] = useState<'real' | 'simulated' | null>(null);
    const [chartTab, setChartTab] = useState<ChartTab>('ohlc');
    
    // --- State for Live Chart Analyzer ---
    const [chartAnalysisPrompt, setChartAnalysisPrompt] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [analyzerState, setAnalyzerState] = useState<AnalyzerState>('idle');
    const [analyzerError, setAnalyzerError] = useState('');
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

     const getDatesForPeriod = (period: string): { startDate: string, endDate: string } => {
        const endDate = new Date();
        const startDate = new Date();
        switch (period) {
            case 'Last Month': startDate.setMonth(endDate.getMonth() - 1); break;
            case 'Last 3 Months': startDate.setMonth(endDate.getMonth() - 3); break;
            case 'Last 6 Months': startDate.setMonth(endDate.getMonth() - 6); break;
            case 'Last Year': startDate.setFullYear(endDate.getFullYear() - 1); break;
        }
        const toYYYYMMDD = (d: Date) => d.toISOString().split('T')[0];
        return { startDate: toYYYYMMDD(startDate), endDate: toYYYYMMDD(endDate) };
    }

    const handleRunLab = async (strategyOverride?: string) => {
        const finalStrategyText = strategyOverride || strategyText;
        if (!apiKey) { setLabError("Please set your Gemini API key."); openKeyModal(); return; }
        if (!finalStrategyText.trim()) { setLabError("Please describe your trading strategy."); return; }

        setLabError('');
        setParsedStrategy(null);
        setBacktestResults(null);
        setCoachingAnalysis('');
        setOhlcData([]);
        setDataSource(null);
        setChartTab('ohlc');

        const hasMarketDataKey = !!(localStorage.getItem('user_twelve_data_api_key') || localStorage.getItem('user_fcsapi_api_key'));

        try {
            setLabState('parsing');
            const parsed = await parseStrategyFromText(apiKey, finalStrategyText, pair, timeframe);
            setParsedStrategy(parsed);

            let data: OhlcData[];

            if (hasMarketDataKey) {
                setDataSource('real');
                setLabState('fetching_data');
                const { startDate, endDate } = getDatesForPeriod(period);
                data = await MarketDataManager.getHistoricalData(pair, timeframe, startDate, endDate);
                if (data.length === 0) {
                    throw new Error("No historical data could be fetched. The provider may not have data for this range or timeframe, or your key may be invalid.");
                }
            } else {
                setDataSource('simulated');
                setLabState('generating_simulation_data');
                data = await generateSimulatedOhlcData(apiKey, parsed);
                 if (data.length === 0) {
                    throw new Error("The AI could not generate a simulated dataset for this strategy.");
                }
            }
            
            setOhlcData(data);

            setLabState('analyzing_data');
            const results = await runBacktestOnHistoricalData(apiKey, parsed, data);
            setBacktestResults(results);

            setLabState('generating_feedback');
            const analysis = await analyzeBacktestResults(apiKey, parsed, results);
            setCoachingAnalysis(analysis);

            setLabState('results');
        } catch (e) {
            console.error(e);
            setLabError(e instanceof Error ? e.message : "An unknown error occurred.");
            setLabState('error');
        }
    };

    useEffect(() => {
        if (initialRequest) {
            setPair(initialRequest.pair);
            setTimeframe(initialRequest.timeframe);
            setPeriod(initialRequest.period);
            setStrategyText(initialRequest.strategyDescription);
            handleRunLab(initialRequest.strategyDescription);
        }
    }, [initialRequest]);


    const handleAnalyzeChart = async () => {
        if (!apiKey) { setAnalyzerError("Please set your Gemini API key."); openKeyModal(); return; }
        if (uploadedFiles.length === 0) { setAnalyzerError("Please upload at least one chart screenshot."); return; }

        setAnalyzerError('');
        setAnalysisResult(null);
        setAnalyzerState('analyzing');

        try {
            const result = await analyzeLiveChart(apiKey, chartAnalysisPrompt, uploadedFiles);
            setAnalysisResult(result);
            setAnalyzerState('results');
        } catch (e) {
            console.error(e);
            setAnalyzerError(e instanceof Error ? e.message : "An unknown error occurred during analysis.");
            setAnalyzerState('error');
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            if (uploadedFiles.length + files.length > MAX_UPLOADS) {
                setAnalyzerError(`You can upload a maximum of ${MAX_UPLOADS} images.`);
                return;
            }
            try {
                const newFilesPromises = [];
                for (let i = 0; i < files.length; i++) {
                    const file = files.item(i);
                    if (file) {
                        newFilesPromises.push(readFileAndConvertToBase64(file));
                    }
                }
                const newFilesData = await Promise.all(newFilesPromises);
                setUploadedFiles(prev => [...prev, ...newFilesData]);
            } catch (err) {
                console.error("Error reading file:", err);
                setAnalyzerError("Could not read the uploaded file.");
            } finally {
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        }
    };

    const removeFile = (indexToRemove: number) => {
        setUploadedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const resetLab = () => { setLabState('idle'); setLabError(''); setParsedStrategy(null); setBacktestResults(null); setCoachingAnalysis(''); setOhlcData([]); };
    const resetAnalyzer = () => { setAnalyzerState('idle'); setAnalyzerError(''); setUploadedFiles([]); setChartAnalysisPrompt(''); setAnalysisResult(null); };

    const getLabLoadingMessage = () => {
        switch(labState) {
            case 'parsing': return "AI is understanding your strategy...";
            case 'fetching_data': return `Fetching historical data for ${pair}...`;
            case 'generating_simulation_data': return 'No market data key found in Settings. AI is generating a simulated dataset...';
            case 'analyzing_data': return `AI is running backtest on ${dataSource} data...`;
            case 'generating_feedback': return "Generating coaching feedback...";
            default: return "";
        }
    };

    const TabButton: React.FC<{ tab: ActiveTab, label: string }> = ({ tab, label }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === tab ? 'bg-cyan-500 text-slate-900' : 'text-slate-300 hover:bg-slate-700'}`}
        >
            {label}
        </button>
    );

    const ChartTabButton: React.FC<{ tab: ChartTab, label: string }> = ({ tab, label }) => (
         <button
            onClick={() => setChartTab(tab)}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${chartTab === tab ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">AI Strategy Lab</h1>
            <p className="text-gray-400 mb-6">Design, test, and analyze trading strategies using natural language and real-time chart data.</p>
            
            <div className="flex space-x-2 mb-6 border-b border-slate-700">
                <TabButton tab="lab" label="Strategy Lab" />
                <TabButton tab="analyzer" label="Live Chart Analysis" />
            </div>

            {activeTab === 'lab' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-[fade-in_0.5s]">
                    {/* Strategy Lab Input Panel */}
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="strategyText" className="block text-lg font-semibold text-white mb-2">1. Describe Your Trading Strategy</label>
                            <textarea id="strategyText" value={strategyText} onChange={e => setStrategyText(e.target.value)} placeholder='e.g., "Enter short when price sweeps a major high then breaks the last low. Place stop loss above the sweep and target a 1:3 RR."' rows={8} className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-gray-300 focus:ring-2 focus:ring-cyan-500" />
                        </div>
                        <div>
                            <label className="block text-lg font-semibold text-white mb-2">2. Set Parameters</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <select value={pair} onChange={e => setPair(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white font-semibold focus:ring-2 focus:ring-cyan-500"><option disabled>Pair</option>{MAJOR_PAIRS.map(p => <option key={p} value={p}>{p}</option>)}</select>
                                <select value={timeframe} onChange={e => setTimeframe(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white font-semibold focus:ring-2 focus:ring-cyan-500"><option disabled>Timeframe</option>{TIMEFRAMES.map(t => <option key={t} value={t}>{t}</option>)}</select>
                                <select value={period} onChange={e => setPeriod(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white font-semibold focus:ring-2 focus:ring-cyan-500"><option disabled>Period</option>{PERIODS.map(p => <option key={p} value={p}>{p}</option>)}</select>
                            </div>
                        </div>
                        <button onClick={() => handleRunLab()} disabled={labState !== 'idle' && labState !== 'error'} className="w-full py-3 bg-cyan-500 text-gray-900 font-bold rounded-lg shadow-md hover:bg-cyan-400 disabled:bg-gray-600 flex items-center justify-center"><SparklesIcon className="w-6 h-6 mr-2" />Analyze Strategy</button>
                    </div>
                    {/* Strategy Lab Output Panel */}
                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 min-h-[400px] flex flex-col">
                        {labState === 'idle' && <div className="m-auto text-center"><BeakerIcon className="w-12 h-12 mx-auto text-slate-500" /><p className="mt-2 text-slate-400">Results will appear here.</p></div>}
                        {labState !== 'idle' && labState !== 'results' && labState !== 'error' && <div className="m-auto text-center"><LoadingSpinner /><p className="mt-3 text-gray-400">{getLabLoadingMessage()}</p></div>}
                        {labState === 'error' && <div className="m-auto text-center"><p className="text-red-400 bg-red-500/10 p-4 rounded-md">{labError}</p><button onClick={resetLab} className="mt-4 px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500">Try Again</button></div>}
                        {labState === 'results' && backtestResults && coachingAnalysis && (
                            <div className="animate-[fade-in_0.5s] space-y-6 overflow-y-auto">
                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="text-xl font-bold text-white">
                                            Chart ({dataSource === 'real' ? 'Real Historical Data' : 'AI-Generated Simulation'})
                                        </h3>
                                        <div className="flex space-x-1 p-1 bg-slate-900/50 rounded-lg">
                                            <ChartTabButton tab="ohlc" label="Price Chart" />
                                            <ChartTabButton tab="equity" label="Equity Curve" />
                                        </div>
                                    </div>
                                    <div className="w-full aspect-video bg-slate-900 rounded-md">
                                        {chartTab === 'ohlc' ? (
                                             <OhlcChart data={ohlcData} trades={backtestResults.tradeLog} />
                                        ) : (
                                            <EquityCurveChart tradeLog={backtestResults.tradeLog || []} avgRR={backtestResults.avgRR} />
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1 text-center">
                                        {chartTab === 'ohlc' ? 'Chart displays up to 500 most recent candles from the dataset.' : 'Equity curve assumes 1 unit of risk per trade.'}
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-3">Performance Report</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-center">
                                        <MetricCard label="Win Rate" value={`${(backtestResults.winRate ?? 0).toFixed(1)}%`} />
                                        <MetricCard label="Profit Factor" value={(backtestResults.profitFactor ?? 0).toFixed(2)} />
                                        <MetricCard label="Avg. R:R" value={`1:${(backtestResults.avgRR ?? 0).toFixed(2)}`} />
                                        <MetricCard label="Total Trades" value={String(backtestResults.totalTrades ?? 0)} />
                                        <MetricCard label="Max Drawdown" value={`${(backtestResults.maxDrawdown ?? 0).toFixed(1)}%`} />
                                    </div>
                                </div>
                                <div className="pt-6 border-t border-gray-700"><h3 className="text-xl font-bold text-white mb-3">AI Coaching Analysis</h3><div className="prose prose-invert prose-sm max-w-none text-gray-300"><FormattedContent text={coachingAnalysis} /></div></div>
                                <button onClick={resetLab} className="w-full mt-4 py-2 bg-gray-600 font-semibold rounded-md hover:bg-gray-500">Test Another Strategy</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {activeTab === 'analyzer' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-[fade-in_0.5s]">
                    {/* Live Chart Analyzer Input Panel */}
                     <div className="space-y-6">
                        <div>
                            <label className="block text-lg font-semibold text-white mb-2">1. Upload Chart Screenshots</label>
                            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple />
                             <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                                {uploadedFiles.length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                        {uploadedFiles.map((file, index) => (
                                            <div key={index} className="relative group aspect-square">
                                                <img src={`data:${file.mimeType};base64,${file.data}`} alt={`Chart preview ${index + 1}`} className="w-full h-full object-cover rounded-md border border-gray-600" />
                                                <button onClick={() => removeFile(index)} className="absolute top-1 right-1 p-0.5 bg-black/60 rounded-full text-white hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity" aria-label={`Remove image ${index + 1}`}>
                                                    <XMarkIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {uploadedFiles.length < MAX_UPLOADS ? (
                                    <button onClick={() => fileInputRef.current?.click()} className="w-full flex flex-col items-center justify-center p-6 bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg hover:border-cyan-500 transition-colors">
                                        <PhotoIcon className="w-10 h-10 text-gray-500" />
                                        <span className="mt-2 text-sm font-semibold text-gray-400">
                                            {uploadedFiles.length === 0 ? 'Click to upload images' : 'Add another image'}
                                        </span>
                                        <span className="text-xs text-gray-500">Up to {MAX_UPLOADS} images</span>
                                    </button>
                                ) : (
                                     <p className="text-center text-sm text-gray-500">Maximum number of images uploaded.</p>
                                )}
                            </div>
                        </div>
                        <div>
                             <label htmlFor="chartAnalysisPrompt" className="block text-lg font-semibold text-white mb-2">2. Add Context (Optional)</label>
                             <textarea id="chartAnalysisPrompt" value={chartAnalysisPrompt} onChange={e => setChartAnalysisPrompt(e.target.value)} placeholder='e.g., "Is there a valid long setup here on EUR/USD 15M, considering the 4H trend?"' rows={4} className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-gray-300 focus:ring-2 focus:ring-cyan-500" />
                        </div>
                        <button onClick={handleAnalyzeChart} disabled={analyzerState !== 'idle' && analyzerState !== 'error'} className="w-full py-3 bg-cyan-500 text-gray-900 font-bold rounded-lg shadow-md hover:bg-cyan-400 disabled:bg-gray-600 flex items-center justify-center"><SparklesIcon className="w-6 h-6 mr-2" />Analyze Live Chart</button>
                    </div>
                     {/* Live Chart Analyzer Output Panel */}
                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 min-h-[400px] flex flex-col">
                        {analyzerState === 'idle' && <div className="m-auto text-center"><BeakerIcon className="w-12 h-12 mx-auto text-slate-500" /><p className="mt-2 text-slate-400">Upload a chart to get started.</p></div>}
                        {analyzerState === 'analyzing' && <div className="m-auto text-center"><LoadingSpinner /><p className="mt-3 text-gray-400">AI is analyzing the chart and fetching live data...</p></div>}
                        {analyzerState === 'error' && <div className="m-auto text-center"><p className="text-red-400 bg-red-500/10 p-4 rounded-md">{analyzerError}</p><button onClick={resetAnalyzer} className="mt-4 px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500">Try Again</button></div>}
                        {analyzerState === 'results' && analysisResult && (
                             <div className="animate-[fade-in_0.5s] space-y-6">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-3">Live Analysis & Trade Idea</h3>
                                    <div className="prose prose-invert prose-sm max-w-none text-gray-300"><FormattedContent text={analysisResult.text} /></div>
                                </div>
                                {analysisResult.sources && analysisResult.sources.length > 0 && (
                                    <div className="pt-6 border-t border-gray-700">
                                        <h4 className="text-sm font-semibold text-gray-400 uppercase mb-2 flex items-center"><LinkIcon className="w-4 h-4 mr-1.5" /> Sources</h4>
                                        <ul className="space-y-1.5">{analysisResult.sources.map((chunk, index) => chunk.web && <li key={index}><a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:underline truncate block" title={chunk.web.title}>{chunk.web.title}</a></li>)}</ul>
                                    </div>
                                )}
                                <button onClick={resetAnalyzer} className="w-full mt-4 py-2 bg-gray-600 font-semibold rounded-md hover:bg-gray-500">Analyze Another Chart</button>
                             </div>
                        )}
                    </div>
                </div>
            )}
            <style>{`@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }`}</style>
        </div>
    );
};