import React, { useState, useRef, useEffect, useCallback } from 'react';
import { generateChartImage, evaluateHistoricalTrade } from '../../services/geminiService';
import { LoadingSpinner } from '../LoadingSpinner';
import { PencilIcon } from '../icons/PencilIcon';
import { MinusIcon } from '../icons/MinusIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { CursorArrowRaysIcon } from '../icons/CursorArrowRaysIcon';
import { ArrowPathIcon } from '../icons/ArrowPathIcon';
import { SparklesIcon } from '../icons/SparklesIcon';
import { PlayIcon } from '../icons/PlayIcon';
import { PauseIcon } from '../icons/PauseIcon';
import { ArrowRightIcon } from '../icons/ArrowRightIcon';
import { RectangleIcon } from '../icons/RectangleIcon';
// FIX: Import useApiKey hook
import { useApiKey } from '../../hooks/useApiKey';

// --- Constants ---
const CHART_WIDTH = 1280;
const CHART_HEIGHT = 720;
const INITIAL_REVEAL_PERCENT = 25;
const HIT_TOLERANCE = 10;
const RESIZE_HANDLE_SIZE = 8;
const STEP_SIZE = 5; // pixels per step

// --- Types ---
type Tool = 'select' | 'trendline' | 'horizontal' | 'rectangle';
type Shape = { id: number; type: Exclude<Tool, 'select'>; color: string; points: { x: number; y: number }[]; lineWidth: number; };
type Interaction =
  | { type: 'none' }
  | { type: 'drawing' }
  | { type: 'moving'; id: number }
  | { type: 'resizing'; id: number; handle: 'start' | 'end' };
type GameState = 'idle' | 'loading' | 'simulating' | 'finished';
type TradeSide = 'buy' | 'sell';
type Trade = { side: TradeSide | null; entry: number | null; stopLoss: number | null; takeProfit: number | null; };
type TradeStatus = 'pending' | 'win' | 'loss';

// --- Helper Functions ---
const distance = (p1: {x:number, y:number}, p2: {x:number, y:number}) => Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
const isPointOnLine = (p: {x:number, y:number}, start: {x:number, y:number}, end: {x:number, y:number}) => {
    const d1 = distance(p, start);
    const d2 = distance(p, end);
    const lineLen = distance(start, end);
    return Math.abs(d1 + d2 - lineLen) < HIT_TOLERANCE / 2;
};
const getNormalizedRect = (p1: {x:number, y:number}, p2: {x:number, y:number}) => {
    return { x: Math.min(p1.x, p2.x), y: Math.min(p1.y, p2.y), width: Math.abs(p1.x - p2.x), height: Math.abs(p1.y - p2.y) };
}
const formatPrice = (y: number | null) => y === null ? '?.???' : (1000 - (y / CHART_HEIGHT) * 100).toFixed(3);
const getShapeAtPosition = (coords: {x: number, y: number}, shapes: Shape[]): Shape | null => {
    for (let i = shapes.length - 1; i >= 0; i--) {
        const shape = shapes[i];
        const [start, end] = shape.points;
        switch(shape.type) {
            case 'trendline':
                if (end && isPointOnLine(coords, start, end)) return shape;
                break;
            case 'horizontal':
                if (Math.abs(coords.y - start.y) < HIT_TOLERANCE) return shape;
                break;
            case 'rectangle':
                 if (!end) continue;
                const { x, y, width, height } = getNormalizedRect(start, end);
                if (isPointOnLine(coords, {x,y}, {x:x+width,y}) || isPointOnLine(coords, {x:x+width,y}, {x:x+width,y:y+height}) || isPointOnLine(coords, {x:x+width,y:y+height}, {x,y:y+height}) || isPointOnLine(coords, {x,y:y+height}, {x,y})) return shape;
                break;
        }
    }
    return null;
}
const getHandleAtPosition = (coords: {x: number, y: number}, shape: Shape): 'start' | 'end' | null => {
    const [start, end] = shape.points;
    if (distance(coords, start) < RESIZE_HANDLE_SIZE) return 'start';
    if (end && distance(coords, end) < RESIZE_HANDLE_SIZE) return 'end';
    return null;
}
const FormattedContent: React.FC<{ text: string }> = ({ text }) => {
    const lines = text.split('\n').filter(p => p.trim() !== '');
    const renderInline = (line: string) => line.split(/\*\*(.*?)\*\*/g).map((part, i) => i % 2 === 1 ? <strong key={i} className="font-bold text-cyan-300">{part}</strong> : part);
    return <>{lines.map((line, i) => <p key={i} className="mb-2">{renderInline(line)}</p>)}</>;
};

export const LiveChartSimulatorView: React.FC = () => {
    const [gameState, setGameState] = useState<GameState>('idle');
    const [chartImageUrl, setChartImageUrl] = useState<string>('');
    const [chartGenPrompt, setChartGenPrompt] = useState('');
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
    const [curtainX, setCurtainX] = useState(CHART_WIDTH * (INITIAL_REVEAL_PERCENT / 100));
    
    const [shapes, setShapes] = useState<Shape[]>([]);
    const [activeTool, setActiveTool] = useState<Tool>('trendline');
    const [interaction, setInteraction] = useState<Interaction>({ type: 'none' });
    const [selectedShapeId, setSelectedShapeId] = useState<number | null>(null);
    const [drawingPoints, setDrawingPoints] = useState<{x: number, y: number}[]>([]);
    
    const [trade, setTrade] = useState<Trade>({ side: null, entry: null, stopLoss: null, takeProfit: null });
    const [tradeStatus, setTradeStatus] = useState<TradeStatus>('pending');
    
    const [feedback, setFeedback] = useState('');
    const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);

    // FIX: Get apiKey from context
    const { apiKey, openKeyModal } = useApiKey();
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const animationFrameRef = useRef<number>();
    const lastTimeRef = useRef<number>(0);

    const resetSimulation = () => {
        setIsPlaying(false);
        setCurtainX(CHART_WIDTH * (INITIAL_REVEAL_PERCENT / 100));
        setShapes([]);
        setSelectedShapeId(null);
        setTrade({ side: null, entry: null, stopLoss: null, takeProfit: null });
        setTradeStatus('pending');
        setFeedback('');
        setIsLoadingFeedback(false);
    };

    const handleStart = async () => {
        // FIX: Check for apiKey before making API call
        if (!apiKey) {
            openKeyModal();
            return;
        }
        setGameState('loading');
        resetSimulation();
        const prompt = "A dark-themed 15-minute forex candlestick chart showing a complete trade scenario. The scenario should involve a clear Smart Money Concept setup (like a liquidity sweep, market structure shift, and return to an order block or FVG). The entire price action, from the start of the setup to its final resolution (e.g., hitting a logical take profit level), must be visible on the chart. The setup should begin around the 25% mark from the left.";
        setChartGenPrompt(prompt);
        try {
            // FIX: Pass apiKey to generateChartImage
            const url = await generateChartImage(apiKey, prompt);
            setChartImageUrl(url);
            setGameState('simulating');
        } catch (e) {
            console.error(e);
            setGameState('idle');
        }
    };

    const animate = useCallback((timestamp: number) => {
        if (!isPlaying || gameState !== 'simulating') return;
        
        if (timestamp - lastTimeRef.current >= 16) { // Roughly 60fps
            setCurtainX(prevX => {
                const newX = prevX + (0.5 * playbackSpeed);
                if (newX >= CHART_WIDTH) {
                    setIsPlaying(false);
                    return CHART_WIDTH;
                }
                return newX;
            });
            lastTimeRef.current = timestamp;
        }
        animationFrameRef.current = requestAnimationFrame(animate);
    }, [isPlaying, gameState, playbackSpeed]);

    useEffect(() => {
        if (isPlaying) {
            lastTimeRef.current = performance.now();
            animationFrameRef.current = requestAnimationFrame(animate);
        } else {
            if(animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        }
        return () => { if(animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
    }, [isPlaying, animate]);
    
    const redrawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (imageRef.current?.complete) ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
        
        shapes.forEach(shape => {
            ctx.strokeStyle = shape.color;
            ctx.lineWidth = shape.lineWidth;
            const [start, end] = shape.points;
            ctx.beginPath();
            if (shape.type === 'horizontal') ctx.moveTo(0, start.y), ctx.lineTo(canvas.width, start.y);
            else if (shape.type === 'rectangle' && end) { const { x, y, width, height } = getNormalizedRect(start, end); ctx.rect(x, y, width, height); }
            else if (end) ctx.moveTo(start.x, start.y), ctx.lineTo(end.x, end.y);
            ctx.stroke();
        });
        
        if (interaction.type === 'drawing' && drawingPoints.length > 1) { /* ... draw temp shape ... */ }

        const drawTradeLine = (y: number, color: string, label: string) => { /* ... draw trade line ... */ };
        if(trade.entry !== null) drawTradeLine(trade.entry, '#60a5fa', 'Entry');
        if(trade.stopLoss !== null) drawTradeLine(trade.stopLoss, '#f87171', 'Stop Loss');
        if(trade.takeProfit !== null) drawTradeLine(trade.takeProfit, '#34d399', 'Take Profit');

        ctx.fillStyle = 'rgba(17, 24, 39, 0.95)';
        ctx.fillRect(curtainX, 0, canvas.width - curtainX, canvas.height);
        ctx.strokeStyle = '#0891b2';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(curtainX, 0);
        ctx.lineTo(curtainX, canvas.height);
        ctx.stroke();
    }, [shapes, interaction, drawingPoints, trade, curtainX]);

    useEffect(() => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = chartImageUrl;
        img.onload = () => { imageRef.current = img; redrawCanvas(); };
    }, [chartImageUrl, redrawCanvas]);

    useEffect(() => { redrawCanvas(); }, [shapes, trade, curtainX, redrawCanvas]);

    // Simplified canvas interaction logic (adapted from FreePracticeCanvasView)
    const handleMouseDown = (e: React.MouseEvent) => { /* ... */ };
    const handleMouseMove = (e: React.MouseEvent) => { /* ... */ };
    const handleMouseUp = () => { /* ... */ };

    const handleGetFeedback = async () => {
        // FIX: Check for apiKey before making API call
        if (!apiKey) {
            openKeyModal();
            return;
        }
        setIsLoadingFeedback(true);
        const tradeDetails = `Side: ${trade.side}, Entry: ${formatPrice(trade.entry)}, SL: ${formatPrice(trade.stopLoss)}, TP: ${formatPrice(trade.takeProfit)}`;
        try {
            // FIX: Pass apiKey to evaluateHistoricalTrade
            const result = await evaluateHistoricalTrade(apiKey, chartGenPrompt, {}, tradeDetails);
            setFeedback(result.feedback);
            setTradeStatus(result.outcome === 'Win' ? 'win' : 'loss');
        } catch(e) {
            setFeedback('Sorry, the AI mentor could not provide feedback at this time.');
        } finally {
            setIsLoadingFeedback(false);
            setGameState('finished');
        }
    };

    if (gameState === 'idle' || gameState === 'loading') {
        return (
            <div className="text-center">
                <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">Live Chart Simulation</h1>
                <p className="text-gray-400 mb-6 max-w-2xl mx-auto">Practice trading on a historical chart that reveals itself candle-by-candle.</p>
                {gameState === 'loading' ? <LoadingSpinner /> : <button onClick={handleStart} className="px-6 py-3 bg-cyan-500 text-gray-900 font-semibold rounded-lg shadow-md hover:bg-cyan-400">Start New Simulation</button>}
            </div>
        );
    }
    
    return (
        <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
                <canvas ref={canvasRef} width={CHART_WIDTH} height={CHART_HEIGHT} className="w-full aspect-video bg-gray-800 rounded-lg border border-gray-700" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} />
            </div>
            <div className="w-full lg:w-80 bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col space-y-4">
                <h2 className="text-xl font-bold text-white text-center">Control Panel</h2>
                {/* Playback Controls */}
                <div className="p-2 bg-gray-900/50 rounded-md space-y-2">
                    <div className="flex items-center justify-center gap-2">
                         <button onClick={() => setIsPlaying(!isPlaying)} className="p-2 bg-gray-700 rounded-md hover:bg-gray-600"><span className="sr-only">{isPlaying ? "Pause" : "Play"}</span>{isPlaying ? <PauseIcon className="w-6 h-6"/> : <PlayIcon className="w-6 h-6"/>}</button>
                         <button onClick={() => setCurtainX(p => Math.min(p + STEP_SIZE, CHART_WIDTH))} className="p-2 bg-gray-700 rounded-md hover:bg-gray-600"><span className="sr-only">Next Candle</span><ArrowRightIcon className="w-6 h-6"/></button>
                         <button onClick={() => { resetSimulation(); setGameState('simulating'); }} className="p-2 bg-gray-700 rounded-md hover:bg-gray-600"><span className="sr-only">Reset</span><ArrowPathIcon className="w-6 h-6"/></button>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-400">Speed:</label>
                        <input type="range" min="0.5" max="5" step="0.5" value={playbackSpeed} onChange={e => setPlaybackSpeed(Number(e.target.value))} className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer range-sm"/>
                    </div>
                </div>
                {/* Trade Panel */}
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setTrade(t => ({...t, side: 'buy'}))} className={`py-2 rounded font-semibold ${trade.side === 'buy' ? 'bg-green-500 ring-2' : 'bg-gray-700'}`}>BUY</button>
                    <button onClick={() => setTrade(t => ({...t, side: 'sell'}))} className={`py-2 rounded font-semibold ${trade.side === 'sell' ? 'bg-red-500 ring-2' : 'bg-gray-700'}`}>SELL</button>
                </div>
                {/* Analysis Tools */}
                <div className="flex items-center space-x-1 bg-gray-900/50 p-1 rounded-md">
                    <button onClick={() => setActiveTool('select')} title="Select" className={`p-2 rounded ${activeTool === 'select' ? 'bg-cyan-500/20' : ''}`}><CursorArrowRaysIcon className="w-5 h-5"/></button>
                    <button onClick={() => setActiveTool('trendline')} title="Trendline" className={`p-2 rounded ${activeTool === 'trendline' ? 'bg-cyan-500/20' : ''}`}><PencilIcon className="w-5 h-5"/></button>
                    <button onClick={() => setActiveTool('horizontal')} title="Horizontal Line" className={`p-2 rounded ${activeTool === 'horizontal' ? 'bg-cyan-500/20' : ''}`}><MinusIcon className="w-5 h-5"/></button>
                    <button onClick={() => setActiveTool('rectangle')} title="Rectangle" className={`p-2 rounded ${activeTool === 'rectangle' ? 'bg-cyan-500/20' : ''}`}><RectangleIcon className="w-5 h-5"/></button>
                    <button onClick={() => setShapes([])} title="Clear Drawings" className="p-2 rounded"><TrashIcon className="w-5 h-5"/></button>
                </div>
                <div className="flex-grow"></div>
                {gameState === 'simulating' && <button onClick={handleGetFeedback} disabled={isLoadingFeedback || !trade.side} className="w-full mt-auto py-2.5 bg-purple-500 font-semibold rounded disabled:bg-gray-600 flex items-center justify-center"><SparklesIcon className="w-5 h-5 mr-2" />{isLoadingFeedback ? <LoadingSpinner/> : 'Finish & Get Feedback'}</button>}
                {gameState === 'finished' && (
                    <div className="p-3 bg-gray-900/50 rounded-md">
                        <h3 className="font-bold text-lg mb-2 text-center">Result: <span className={tradeStatus === 'win' ? 'text-green-400' : 'text-red-400'}>{tradeStatus.toUpperCase()}</span></h3>
                        <div className="text-sm overflow-y-auto max-h-48"><FormattedContent text={feedback} /></div>
                        <button onClick={handleStart} className="w-full mt-3 py-2 bg-gray-600 font-semibold rounded">New Simulation</button>
                    </div>
                )}
            </div>
        </div>
    );
};
