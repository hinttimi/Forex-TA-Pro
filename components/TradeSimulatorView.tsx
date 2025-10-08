
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
import { ArrowsPointingOutIcon } from '../icons/ArrowsPointingOutIcon';
import { XMarkIcon } from '../icons/XMarkIcon';
import { BookmarkSquareIcon } from '../icons/BookmarkSquareIcon';
import { useCompletion } from '../../hooks/useCompletion';
import { useBadges } from '../../hooks/useBadges';
import { useApiKey } from '../../hooks/useApiKey';

// --- Constants ---
const CHART_WIDTH = 1280;
const CHART_HEIGHT = 720;
const PAUSE_CURTAIN_WIDTH_PERCENT = 45; // a bit less than 50% to give a clue
const HIT_TOLERANCE = 10;
const RESIZE_HANDLE_SIZE = 8;
const SIMULATOR_APPRENTICE_GOAL = 5;
const ARCHIVIST_GOAL = 3;


// --- Helper Functions ---
const distance = (p1: {x:number, y:number}, p2: {x:number, y:number}) => Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);

const isPointOnLine = (p: {x:number, y:number}, start: {x:number, y:number}, end: {x:number, y:number}) => {
    const d1 = distance(p, start);
    const d2 = distance(p, end);
    const lineLen = distance(start, end);
    return Math.abs(d1 + d2 - lineLen) < HIT_TOLERANCE / 2;
};

// --- Types ---
type Tool = 'select' | 'trendline' | 'horizontal';
type Shape = { id: number; type: Exclude<Tool, 'select'>; color: string; points: { x: number; y: number }[]; lineWidth: number; };
type Interaction =
  | { type: 'none' }
  | { type: 'drawing' }
  | { type: 'moving'; id: number }
  | { type: 'resizing'; id: number; handle: 'start' | 'end' };
type GameState = 'idle' | 'loading' | 'analyzing' | 'placing_trade' | 'feedback' | 'reviewing';
type TradeSide = 'buy' | 'sell';
type Trade = { side: TradeSide | null; entry: number | null; stopLoss: number | null; takeProfit: number | null; };
type PlacementStep = 'entry' | 'stopLoss' | 'takeProfit' | 'done';

const getShapeAtPosition = (coords: {x: number, y: number}, shapes: Shape[]): Shape | null => {
    for (let i = shapes.length - 1; i >= 0; i--) {
        const shape = shapes[i];
        const [start, end] = shape.points;
        if (shape.type === 'trendline' && end && isPointOnLine(coords, start, end)) return shape;
        if (shape.type === 'horizontal' && Math.abs(coords.y - start.y) < HIT_TOLERANCE) return shape;
    }
    return null;
}

const getHandleAtPosition = (coords: {x: number, y: number}, shape: Shape): 'start' | 'end' | null => {
    const [start, end] = shape.points;
    if (distance(coords, start) < RESIZE_HANDLE_SIZE) return 'start';
    if (end && distance(coords, end) < RESIZE_HANDLE_SIZE) return 'end';
    return null;
}

// Helper to format Y coordinate as a price
const formatPrice = (y: number | null) => y === null ? '?.???' : (1000 - (y / CHART_HEIGHT) * 100).toFixed(3);


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
            elements.push(<ul key={`ul-${elements.length}`} className="list-disc space-y-1 my-3 pl-5">{listItems}</ul>);
            listItems = [];
        }
    };

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        const isListItem = trimmedLine.startsWith('* ');

        if (isListItem) {
            listItems.push(<li key={index}>{renderInlineMarkdown(trimmedLine.substring(2))}</li>);
        } else {
            flushListItems();
            elements.push(<p key={index} className="mb-3 leading-relaxed">{renderInlineMarkdown(trimmedLine)}</p>);
        }
    });
    
    flushListItems();

    return <>{elements}</>;
};


export const TradeSimulatorView: React.FC = () => {
    const [gameState, setGameState] = useState<GameState>('idle');
    const [chartImageUrl, setChartImageUrl] = useState<string>('');
    const [chartGenPrompt, setChartGenPrompt] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Drawing state
    const [shapes, setShapes] = useState<Shape[]>([]);
    const [activeTool, setActiveTool] = useState<Tool>('trendline');
    const [drawingPoints, setDrawingPoints] = useState<{x: number, y: number}[]>([]);
    const [interaction, setInteraction] = useState<Interaction>({ type: 'none' });
    const [selectedShapeId, setSelectedShapeId] = useState<number | null>(null);

    // Trade state
    const [trade, setTrade] = useState<Trade>({ side: null, entry: null, stopLoss: null, takeProfit: null });
    const [placementStep, setPlacementStep] = useState<PlacementStep>('entry');

    // Feedback and saving state
    const [feedback, setFeedback] = useState('');
    const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
    const [isAnalysisSaved, setIsAnalysisSaved] = useState(false);
    
    const { apiKey, openKeyModal } = useApiKey();
    const { logSimulatorCompletion, logSavedAnalysis, getCompletionCount } = useCompletion();
    const { unlockBadge } = useBadges();

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const dragStartPointRef = useRef({x: 0, y: 0});

    const handleGenerateChart = async () => {
        if (!apiKey) {
            openKeyModal();
            return;
        }
        setGameState('loading');
        setChartImageUrl('');
        setShapes([]);
        setSelectedShapeId(null);
        setTrade({ side: null, entry: null, stopLoss: null, takeProfit: null });
        setPlacementStep('entry');
        setFeedback('');
        setActiveTool('trendline');
        setIsAnalysisSaved(false);
        
        logSimulatorCompletion();
        if (getCompletionCount('simulatorRuns') + 1 >= SIMULATOR_APPRENTICE_GOAL) {
            unlockBadge('simulator-apprentice');
        }

        const prompt = "You are an AI chart generator. Create a dark-themed forex candlestick chart showing a clear, high-probability trade setup based on Smart Money Concepts. The setup could be a bullish or bearish scenario involving a liquidity sweep, a change of character, and a clear point of interest (like an order block or FVG). The chart must show the full price action from setup to resolution. The setup should occur around the horizontal middle of the chart.";
        setChartGenPrompt(prompt);
        try {
            const url = await generateChartImage(apiKey, prompt);
            setChartImageUrl(url);
            setGameState('analyzing');
        } catch (e) {
            console.error(e);
            setGameState('idle');
        }
    };

    const getCanvasCoordinates = (event: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } | null => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return { 
            x: (event.clientX - rect.left) * scaleX, 
            y: (event.clientY - rect.top) * scaleY 
        };
    };

    const redrawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (imageRef.current?.complete) {
            ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
        }

        shapes.forEach(shape => {
            ctx.strokeStyle = shape.color;
            ctx.lineWidth = shape.lineWidth;
            const [start, end] = shape.points;
            ctx.beginPath();
            if (shape.type === 'horizontal') {
                ctx.moveTo(0, start.y);
                ctx.lineTo(canvas.width, start.y);
            } else if (end) {
                ctx.moveTo(start.x, start.y);
                ctx.lineTo(end.x, end.y);
            }
            ctx.stroke();
        });

        const selectedShape = shapes.find(s => s.id === selectedShapeId);
        if(selectedShape) {
            ctx.fillStyle = '#FFFFFF';
            selectedShape.points.forEach(p => {
                if(!p) return;
                ctx.beginPath();
                ctx.rect(p.x - RESIZE_HANDLE_SIZE / 2, p.y - RESIZE_HANDLE_SIZE / 2, RESIZE_HANDLE_SIZE, RESIZE_HANDLE_SIZE);
                ctx.fill();
            });
        }

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
        if(trade.entry !== null) drawTradeLine(trade.entry, '#60a5fa', 'Entry');
        if(trade.stopLoss !== null) drawTradeLine(trade.stopLoss, '#f87171', 'Stop Loss');
        if(trade.takeProfit !== null) drawTradeLine(trade.takeProfit, '#34d399', 'Take Profit');

        if (gameState === 'analyzing' || gameState === 'placing_trade' || gameState === 'feedback') {
            const curtainX = CHART_WIDTH * (1 - PAUSE_CURTAIN_WIDTH_PERCENT / 100);
            ctx.fillStyle = 'rgba(17, 24, 39, 0.9)';
            ctx.fillRect(curtainX, 0, canvas.width - curtainX, canvas.height);
            ctx.fillStyle = '#6b7280';
            ctx.font = 'bold 24px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('???', curtainX + (canvas.width - curtainX)/2, canvas.height/2);
            ctx.textAlign = 'left';
        }

    }, [shapes, interaction.type, drawingPoints, activeTool, trade, gameState, selectedShapeId]);
    
    useEffect(() => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = chartImageUrl;
        img.onload = () => { imageRef.current = img; redrawCanvas(); };
    }, [chartImageUrl, redrawCanvas]);

    useEffect(() => { redrawCanvas(); }, [shapes, trade, gameState, redrawCanvas, isModalOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if((e.key === 'Delete' || e.key === 'Backspace') && selectedShapeId !== null && gameState === 'analyzing') {
                setShapes(prev => prev.filter(s => s.id !== selectedShapeId));
                setSelectedShapeId(null);
            }
            if (e.key === 'Escape' && isModalOpen) {
                setIsModalOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedShapeId, gameState, isModalOpen]);

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const coords = getCanvasCoordinates(e);
        if (!coords) return;
        
        if (gameState === 'placing_trade') {
            if (placementStep === 'entry') setTrade(t => ({...t, entry: coords.y}));
            else if (placementStep === 'stopLoss') setTrade(t => ({...t, stopLoss: coords.y}));
            else if (placementStep === 'takeProfit') setTrade(t => ({...t, takeProfit: coords.y}));
            return;
        }

        if (gameState !== 'analyzing') return;
        
        dragStartPointRef.current = coords;

        if (activeTool === 'select') {
            const selectedShape = shapes.find(s => s.id === selectedShapeId);
            if (selectedShape) {
                const handle = getHandleAtPosition(coords, selectedShape);
                if (handle) {
                    setInteraction({ type: 'resizing', id: selectedShape.id, handle });
                    return;
                }
            }
            const shapeToSelect = getShapeAtPosition(coords, shapes);
            if (shapeToSelect) {
                setSelectedShapeId(shapeToSelect.id);
                setInteraction({ type: 'moving', id: shapeToSelect.id });
            } else {
                setSelectedShapeId(null);
            }
        } else {
            setSelectedShapeId(null);
            setInteraction({ type: 'drawing' });
            setDrawingPoints([coords]);
        }
    };
    
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const coords = getCanvasCoordinates(e);
        if (!coords || gameState !== 'analyzing') return;
        
        const dx = coords.x - dragStartPointRef.current.x;
        const dy = coords.y - dragStartPointRef.current.y;

        switch (interaction.type) {
            case 'drawing':
                if (drawingPoints.length > 0) setDrawingPoints([drawingPoints[0], coords]);
                break;
            case 'moving':
                setShapes(prev => prev.map(s => s.id === interaction.id
                    ? { ...s, points: s.points.map(p => ({ x: p.x + dx, y: p.y + dy })) }
                    : s
                ));
                dragStartPointRef.current = coords;
                break;
            case 'resizing':
                setShapes(prev => prev.map(s => {
                    if (s.id !== interaction.id) return s;
                    const newPoints = [...s.points];
                    if (interaction.handle === 'start') newPoints[0] = coords;
                    else newPoints[1] = coords;
                    return { ...s, points: newPoints };
                }));
                break;
        }
    };
    
    const handleMouseUp = () => {
        if (gameState !== 'analyzing') return;
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
        setActiveTool('select');
    };

    useEffect(() => {
        if(trade.entry !== null && placementStep === 'entry') setPlacementStep('stopLoss');
        else if (trade.stopLoss !== null && placementStep === 'stopLoss') setPlacementStep('takeProfit');
        else if (trade.takeProfit !== null && placementStep === 'takeProfit') setPlacementStep('done');
    }, [trade, placementStep]);

    const handleGetFeedback = async () => {
        if (!apiKey) {
            openKeyModal();
            return;
        }
        setGameState('feedback');
        setIsLoadingFeedback(true);
        const tradeDetails = `Side: ${trade.side}, Entry at price ${formatPrice(trade.entry)}, Stop Loss at ${formatPrice(trade.stopLoss)}, Take Profit at ${formatPrice(trade.takeProfit)}.`;
        try {
            const fb = await generateTradeFeedback(apiKey, chartGenPrompt, tradeDetails);
            setFeedback(fb);
        } catch(e) {
            setFeedback('Sorry, the AI mentor could not provide feedback at this time. Please check your API key.');
        } finally {
            setIsLoadingFeedback(false);
        }
    };

    const handleSaveAnalysis = () => {
        if (!canvasRef.current) return;
        
        const dataUrl = canvasRef.current.toDataURL('image/png');
        try {
            const existing = JSON.parse(localStorage.getItem('savedAnalyses') || '[]');
            const newItem = { id: Date.now(), imageData: dataUrl };
            const updated = [newItem, ...existing];
            localStorage.setItem('savedAnalyses', JSON.stringify(updated));
            setIsAnalysisSaved(true);
            logSavedAnalysis();
            if (getCompletionCount('savedAnalyses') + 1 >= ARCHIVIST_GOAL) {
                unlockBadge('archivist');
            }
        } catch (error) {
            console.error("Failed to save analysis to local storage:", error);
            alert("Could not save analysis. Local storage might be full or disabled.");
        }
    };
    
    const getPlacementInstruction = () => {
        switch (placementStep) {
            case 'entry': return 'Click on the chart to set your Entry price.';
            case 'stopLoss': return 'Now, click to set your Stop Loss.';
            case 'takeProfit': return 'Finally, click to set your Take Profit.';
            case 'done': return 'Trade is set. Get feedback or see the result.';
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

    const canvasElement = (
        <canvas 
            ref={canvasRef} 
            width={CHART_WIDTH} 
            height={CHART_HEIGHT} 
            className="w-full h-full"
            onMouseDown={handleMouseDown} 
            onMouseMove={handleMouseMove} 
            onMouseUp={handleMouseUp} 
            onMouseLeave={handleMouseUp}
            style={{ cursor: gameState === 'analyzing' ? (activeTool === 'select' ? 'default' : 'crosshair') : (gameState === 'placing_trade' && placementStep !== 'done' ? 'pointer' : 'default') }}
        />
    );


    return (
        <>
        <div className={`flex flex-col lg:flex-row gap-6 ${isModalOpen ? 'hidden' : ''}`}>
            <div className="flex-1">
                <div className="w-full aspect-video bg-gray-800 rounded-lg border border-gray-700 overflow-hidden relative group">
                    {canvasElement}
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="absolute top-2 left-2 p-2 bg-gray-800/60 rounded-full text-white hover:bg-gray-700 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                        aria-label="Expand chart"
                    >
                        <ArrowsPointingOutIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="w-full lg:w-80 bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col space-y-4">
                <h2 className="text-xl font-bold text-white text-center">Trade Panel</h2>
                
                { (gameState === 'analyzing' || gameState === 'placing_trade') &&
                    <>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => handlePlaceTrade('buy')} disabled={gameState === 'placing_trade'} className={`py-2 rounded font-semibold transition-colors ${trade.side === 'buy' ? 'bg-green-500 text-white ring-2 ring-white' : 'bg-gray-700 hover:bg-green-600 disabled:bg-gray-800 disabled:text-gray-500'}`}>BUY</button>
                        <button onClick={() => handlePlaceTrade('sell')} disabled={gameState === 'placing_trade'} className={`py-2 rounded font-semibold transition-colors ${trade.side === 'sell' ? 'bg-red-500 text-white ring-2 ring-white' : 'bg-gray-700 hover:bg-red-600 disabled:bg-gray-800 disabled:text-gray-500'}`}>SELL</button>
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
                    { gameState === 'analyzing' &&
                        <div className="pt-2 border-t border-gray-600">
                            <h3 className="text-sm text-gray-400 mb-2">Analysis Tools</h3>
                            <div className="flex items-center space-x-2 bg-gray-900/50 p-1 rounded-md">
                                 <button onClick={() => setActiveTool('select')} title="Select & Move" className={`p-2 rounded ${activeTool === 'select' ? 'bg-cyan-500/20 text-cyan-300' : 'text-gray-400 hover:bg-gray-700'}`}><CursorArrowRaysIcon className="w-5 h-5"/></button>
                                 <button onClick={() => setActiveTool('trendline')} title="Trendline" className={`p-2 rounded ${activeTool === 'trendline' ? 'bg-cyan-500/20 text-cyan-300' : 'text-gray-400 hover:bg-gray-700'}`}><PencilIcon className="w-5 h-5"/></button>
                                 <button onClick={() => setActiveTool('horizontal')} title="Horizontal Line" className={`p-2 rounded ${activeTool === 'horizontal' ? 'bg-cyan-500/20 text-cyan-300' : 'text-gray-400 hover:bg-gray-700'}`}><MinusIcon className="w-5 h-5"/></button>
                                 <button onClick={() => { setShapes([]); setSelectedShapeId(null); }} title="Clear All Drawings" className="p-2 rounded text-red-400 hover:bg-red-500/20"><TrashIcon className="w-5 h-5"/></button>
                            </div>
                        </div>
                    }
                    <div className="flex-grow"></div>
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
                           { gameState === 'feedback' &&
                             <button onClick={() => setGameState('reviewing')} disabled={isLoadingFeedback} className="w-full py-2.5 bg-cyan-500 text-gray-900 font-semibold rounded disabled:bg-gray-600 flex items-center justify-center">
                                Play Forward & See Result <ArrowRightIcon className="w-5 h-5 ml-2" />
                            </button>
                           }
                           { gameState === 'reviewing' &&
                             <button onClick={handleSaveAnalysis} disabled={isAnalysisSaved} className="w-full py-2.5 bg-indigo-500 text-white font-semibold rounded disabled:bg-gray-600 flex items-center justify-center hover:bg-indigo-400">
                                <BookmarkSquareIcon className="w-5 h-5 mr-2" /> {isAnalysisSaved ? 'Saved!' : 'Save Analysis'}
                            </button>
                           }
                             <button onClick={handleGenerateChart} className="w-full py-2 bg-gray-600 text-white font-semibold rounded hover:bg-gray-500 flex items-center justify-center">
                                <ArrowPathIcon className="w-5 h-5 mr-2" /> New Scenario
                            </button>
                        </div>
                    </div>
                }
            </div>
        </div>

        {isModalOpen && (
            <div 
                className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]"
                onClick={() => setIsModalOpen(false)}
            >
                <div 
                    className="relative w-[95vw] h-[95vh] bg-gray-800 rounded-lg border border-gray-700 overflow-hidden shadow-2xl" 
                    onClick={e => e.stopPropagation()}
                >
                    {canvasElement}
                    <button 
                        onClick={() => setIsModalOpen(false)}
                        className="absolute top-2 right-2 p-2 bg-gray-800/60 rounded-full text-white hover:bg-gray-700"
                        aria-label="Close expanded view"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>
        )}
        <style>{`
            @keyframes fade-in {
                from { opacity: 0; }
                to { opacity: 1; }
            }
        `}</style>
        </>
    );
};
