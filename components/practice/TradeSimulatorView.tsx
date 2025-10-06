
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { generateChartImage, generateTradeFeedback } from '../../services/geminiService';
import { LoadingSpinner } from '../LoadingSpinner';
import { PencilIcon } from '../icons/PencilIcon';
import { MinusIcon } from '../icons/MinusIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { CursorArrowRaysIcon } from '../icons/CursorArrowRaysIcon';
import { ArrowPathIcon } from '../icons/ArrowPathIcon';
import { SparklesIcon } from '../icons/SparklesIcon';
import { ArrowRightIcon } from '../icons/ArrowRightIcon';

// --- Types ---
type Tool = 'select' | 'trendline' | 'horizontal';
type Shape = { id: number; type: Exclude<Tool, 'select'>; color: string; points: { x: number; y: number }[]; lineWidth: number; };
type Interaction = | { type: 'none' } | { type: 'drawing' } | { type: 'moving'; id: number };
type GameState = 'idle' | 'loading' | 'analyzing' | 'placing_trade' | 'feedback' | 'reviewing';
type TradeSide = 'buy' | 'sell';
type Trade = { side: TradeSide | null; entry: number | null; stopLoss: number | null; takeProfit: number | null; };
type PlacementStep = 'entry' | 'stopLoss' | 'takeProfit' | 'done';

const CHART_WIDTH = 1280;
const CHART_HEIGHT = 720;
const PAUSE_CURTAIN_WIDTH_PERCENT = 45; // a bit less than 50% to give a clue

// Helper to format Y coordinate as a price
const formatPrice = (y: number | null) => y === null ? '?.???' : (1000 - (y / CHART_HEIGHT) * 100).toFixed(3);


const FormattedContent: React.FC<{ text: string }> = ({ text }) => {
    const parts = text.split(/\*\*(.*?)\*\*/g).map((part, i) =>
        i % 2 === 1 ? <strong key={i} className="font-bold text-cyan-300">{part}</strong> : part
    );
    const paragraphs = text.split('\n').filter(p => p.trim() !== '');

    return (
        <div>
            {paragraphs.map((p, i) => {
                if (p.trim().startsWith('* ')) {
                    return (
                        <ul key={i} className="list-disc list-inside space-y-2 my-3">
                            {paragraphs.filter(line => line.trim().startsWith('* ')).map((item, j) => (
                                <li key={j}>{item.substring(2)}</li>
                            ))}
                        </ul>
                    );
                }
                if (!paragraphs[i-1] || !paragraphs[i-1].trim().startsWith('* ')) {
                    return <p key={i} className="mb-4 leading-relaxed">{p.split(/\*\*(.*?)\*\*/g).map((part, j) => j % 2 === 1 ? <strong key={j} className="font-bold text-cyan-300">{part}</strong> : part)}</p>;
                }
                return null;
            })}
        </div>
    );
};


export const TradeSimulatorView: React.FC = () => {
    const [gameState, setGameState] = useState<GameState>('idle');
    const [chartImageUrl, setChartImageUrl] = useState<string>('');
    const [chartGenPrompt, setChartGenPrompt] = useState('');
    
    // Drawing state
    const [shapes, setShapes] = useState<Shape[]>([]);
    const [activeTool, setActiveTool] = useState<Tool>('trendline');
    const [drawingPoints, setDrawingPoints] = useState<{x: number, y: number}[]>([]);
    const [interaction, setInteraction] = useState<Interaction>({ type: 'none' });
    
    // Trade state
    const [trade, setTrade] = useState<Trade>({ side: null, entry: null, stopLoss: null, takeProfit: null });
    const [placementStep, setPlacementStep] = useState<PlacementStep>('entry');

    // Feedback state
    const [feedback, setFeedback] = useState('');
    const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const dragStartPointRef = useRef({x: 0, y: 0});

    const handleGenerateChart = async () => {
        setGameState('loading');
        setChartImageUrl('');
        setShapes([]);
        setTrade({ side: null, entry: null, stopLoss: null, takeProfit: null });
        setPlacementStep('entry');
        setFeedback('');

        const prompt = "You are an AI chart generator. Create a dark-themed forex candlestick chart showing a clear, high-probability trade setup based on Smart Money Concepts. The setup could be a bullish or bearish scenario involving a liquidity sweep, a change of character, and a clear point of interest (like an order block or FVG). The chart must show the full price action from setup to resolution. The setup should occur around the horizontal middle of the chart.";
        setChartGenPrompt(prompt);
        try {
            const url = await generateChartImage(prompt);
            setChartImageUrl(url);
            setGameState('analyzing');
        } catch (e) {
            console.error(e);
            setGameState('idle');
        }
    };

    // --- Canvas Drawing Logic (adapted from FreePracticeCanvasView) ---
    const getCanvasCoordinates = (event: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    const redrawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (imageRef.current?.complete) {
            ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
        }

        // Draw user shapes
        shapes.forEach(shape => {
            ctx.strokeStyle = shape.color;
            ctx.lineWidth = shape.lineWidth;
            const [start, end] = shape.points;
            if (!end) return;
            ctx.beginPath();
            if (shape.type === 'horizontal') {
                ctx.moveTo(0, start.y);
                ctx.lineTo(canvas.width, start.y);
            } else {
                ctx.moveTo(start.x, start.y);
                ctx.lineTo(end.x, end.y);
            }
            ctx.stroke();
        });

        // Draw temporary drawing shape
        if (interaction.type === 'drawing' && drawingPoints.length > 1) {
            ctx.strokeStyle = '#a78bfa';
            ctx.lineWidth = 2;
            const [start, end] = drawingPoints;
            ctx.beginPath();
            if (activeTool === 'horizontal') {
                 ctx.moveTo(0, start.y);
                 ctx.lineTo(canvas.width, start.y);
            } else {
                ctx.moveTo(start.x, start.y);
                ctx.lineTo(end.x, end.y);
            }
            ctx.stroke();
        }

        // Draw trade lines
        const drawTradeLine = (y: number, color: string, label: string) => {
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = color;
            ctx.font = '14px sans-serif';
            ctx.fillText(label, 10, y - 5);
        };
        if(trade.entry) drawTradeLine(trade.entry, '#60a5fa', 'Entry');
        if(trade.stopLoss) drawTradeLine(trade.stopLoss, '#f87171', 'Stop Loss');
        if(trade.takeProfit) drawTradeLine(trade.takeProfit, '#34d399', 'Take Profit');

        // Draw pause curtain
        if (gameState === 'analyzing' || gameState === 'placing_trade') {
            const curtainX = CHART_WIDTH * (1 - PAUSE_CURTAIN_WIDTH_PERCENT / 100);
            ctx.fillStyle = 'rgba(17, 24, 39, 0.9)';
            ctx.fillRect(curtainX, 0, canvas.width - curtainX, canvas.height);
            ctx.fillStyle = '#6b7280';
            ctx.font = 'bold 24px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('???', curtainX + (canvas.width - curtainX)/2, canvas.height/2);
            ctx.textAlign = 'left';
        }

    }, [shapes, interaction.type, drawingPoints, activeTool, trade, gameState]);
    
    useEffect(() => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = chartImageUrl;
        img.onload = () => { imageRef.current = img; redrawCanvas(); };
    }, [chartImageUrl, redrawCanvas]);

    useEffect(() => { redrawCanvas(); }, [shapes, trade, gameState, redrawCanvas]);

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const coords = getCanvasCoordinates(e);
        
        if (gameState === 'placing_trade') {
            if (placementStep === 'entry') setTrade(t => ({...t, entry: coords.y}));
            else if (placementStep === 'stopLoss') setTrade(t => ({...t, stopLoss: coords.y}));
            else if (placementStep === 'takeProfit') setTrade(t => ({...t, takeProfit: coords.y}));
            return;
        }

        if (gameState === 'analyzing') {
            setInteraction({ type: 'drawing' });
            setDrawingPoints([coords]);
        }
    };
    
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (interaction.type === 'drawing' && drawingPoints.length > 0) {
            const coords = getCanvasCoordinates(e);
            setDrawingPoints([drawingPoints[0], coords]);
        }
    };
    
    const handleMouseUp = () => {
        if (interaction.type === 'drawing' && drawingPoints.length > 1) {
            const newShape: Shape = { id: Date.now(), type: activeTool as Exclude<Tool, 'select'>, color: '#facc15', points: drawingPoints, lineWidth: 2, };
            setShapes(prev => [...prev, newShape]);
        }
        setInteraction({ type: 'none' });
        setDrawingPoints([]);
    };

    const handlePlaceTrade = (side: TradeSide) => {
        setTrade({ side, entry: null, stopLoss: null, takeProfit: null });
        setGameState('placing_trade');
        setPlacementStep('entry');
    };

    useEffect(() => {
        if(trade.entry && placementStep === 'entry') setPlacementStep('stopLoss');
        else if (trade.stopLoss && placementStep === 'stopLoss') setPlacementStep('takeProfit');
        else if (trade.takeProfit && placementStep === 'takeProfit') setPlacementStep('done');
    }, [trade, placementStep]);

    const handleGetFeedback = async () => {
        setGameState('feedback');
        setIsLoadingFeedback(true);
        const tradeDetails = `Side: ${trade.side}, Entry at Y=${trade.entry}, Stop Loss at Y=${trade.stopLoss}, Take Profit at Y=${trade.takeProfit} on a ${CHART_WIDTH}x${CHART_HEIGHT} canvas.`;
        try {
            const fb = await generateTradeFeedback(chartGenPrompt, tradeDetails);
            setFeedback(fb);
        } catch(e) {
            setFeedback('Sorry, the AI mentor could not provide feedback at this time.');
        } finally {
            setIsLoadingFeedback(false);
        }
    };
    
    const getPlacementInstruction = () => {
        switch (placementStep) {
            case 'entry': return 'Click on the chart to set your Entry price.';
            case 'stopLoss': return 'Now, click to set your Stop Loss.';
            case 'takeProfit': return 'Finally, click to set your Take Profit.';
            case 'done': return 'Trade is set. You can now get feedback or see the result.';
        }
    }

    if (gameState === 'idle') {
        return (
            <div className="text-center">
                <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">Trade Simulator</h1>
                <p className="text-gray-400 mb-6 max-w-2xl mx-auto">Apply your knowledge in a realistic trading scenario. Analyze an AI-generated chart, plan your trade, and get expert feedback before seeing the outcome.</p>
                <button onClick={handleGenerateChart} className="px-6 py-3 bg-cyan-500 text-gray-900 font-semibold rounded-lg shadow-md hover:bg-cyan-400">
                    Start Simulation
                </button>
            </div>
        );
    }
     if (gameState === 'loading') {
        return <div className="flex flex-col items-center justify-center h-full"><LoadingSpinner /><p className="mt-2 text-gray-400">AI is generating a unique trade scenario...</p></div>
    }


    return (
        <div className="flex flex-col lg:flex-row gap-6">
            {/* Chart Area */}
            <div className="flex-1">
                <div className="w-full aspect-video bg-gray-800 rounded-lg border border-gray-700 overflow-hidden relative">
                    <canvas ref={canvasRef} width={CHART_WIDTH} height={CHART_HEIGHT} className="w-full h-full"
                        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
                        style={{ cursor: gameState === 'analyzing' ? 'crosshair' : (gameState === 'placing_trade' ? 'pointer' : 'default') }}
                    />
                </div>
            </div>

            {/* Control Panel */}
            <div className="w-full lg:w-80 bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col space-y-4">
                <h2 className="text-xl font-bold text-white text-center">Trade Panel</h2>
                
                { (gameState === 'analyzing' || gameState === 'placing_trade') &&
                    <>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => handlePlaceTrade('buy')} className={`py-2 rounded font-semibold transition-colors ${trade.side === 'buy' ? 'bg-green-500 text-white' : 'bg-gray-700 hover:bg-green-600'}`}>BUY</button>
                        <button onClick={() => handlePlaceTrade('sell')} className={`py-2 rounded font-semibold transition-colors ${trade.side === 'sell' ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-red-600'}`}>SELL</button>
                    </div>
                    { gameState === 'placing_trade' && 
                        <div className="p-3 bg-cyan-900/20 border border-cyan-500/30 rounded text-center text-cyan-300 text-sm">
                            {getPlacementInstruction()}
                        </div>
                    }
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center bg-gray-900/50 p-2 rounded"><span>Entry:</span> <span className="font-mono text-blue-300">{formatPrice(trade.entry)}</span></div>
                        <div className="flex justify-between items-center bg-gray-900/50 p-2 rounded"><span>Stop Loss:</span> <span className="font-mono text-red-300">{formatPrice(trade.stopLoss)}</span></div>
                        <div className="flex justify-between items-center bg-gray-900/50 p-2 rounded"><span>Take Profit:</span> <span className="font-mono text-green-300">{formatPrice(trade.takeProfit)}</span></div>
                    </div>
                    <div className="pt-2 border-t border-gray-600">
                        <h3 className="text-sm text-gray-400 mb-2">Analysis Tools</h3>
                        <div className="flex items-center space-x-2 bg-gray-900/50 p-1 rounded-md">
                             <button onClick={() => setActiveTool('trendline')} className={`p-2 rounded ${activeTool === 'trendline' ? 'bg-cyan-500/20' : ''}`}><PencilIcon className="w-5 h-5"/></button>
                             <button onClick={() => setActiveTool('horizontal')} className={`p-2 rounded ${activeTool === 'horizontal' ? 'bg-cyan-500/20' : ''}`}><MinusIcon className="w-5 h-5"/></button>
                             <button onClick={() => setShapes([])} className="p-2 rounded text-red-400 hover:bg-red-500/20"><TrashIcon className="w-5 h-5"/></button>
                        </div>
                    </div>
                    <button onClick={handleGetFeedback} disabled={placementStep !== 'done'} className="w-full mt-auto py-2.5 bg-purple-500 text-white font-semibold rounded disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-purple-400 flex items-center justify-center">
                        <SparklesIcon className="w-5 h-5 mr-2" /> Get AI Feedback
                    </button>
                    </>
                }

                { (gameState === 'feedback' || gameState === 'reviewing') && 
                    <div className="flex-1 flex flex-col">
                        <h3 className="text-lg font-semibold text-white mb-2">AI Mentor Feedback</h3>
                        {isLoadingFeedback ? <div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div> : <div className="text-sm text-gray-300 bg-gray-900/50 p-3 rounded-md overflow-y-auto max-h-64"><FormattedContent text={feedback} /></div>}
                        <div className="mt-auto space-y-2 pt-4">
                            <button onClick={() => setGameState('reviewing')} disabled={isLoadingFeedback} className="w-full py-2.5 bg-cyan-500 text-gray-900 font-semibold rounded disabled:bg-gray-600 flex items-center justify-center">
                                Play Forward & See Result <ArrowRightIcon className="w-5 h-5 ml-2" />
                            </button>
                             <button onClick={handleGenerateChart} className="w-full py-2 bg-gray-600 text-white font-semibold rounded hover:bg-gray-500 flex items-center justify-center">
                                <ArrowPathIcon className="w-5 h-5 mr-2" /> New Scenario
                            </button>
                        </div>
                    </div>
                }
            </div>
        </div>
    );
};
