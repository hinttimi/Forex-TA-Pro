import React, { useMemo, useEffect, useState, useRef, forwardRef } from 'react';
import { useLiveSimulator } from '../../hooks/useLiveSimulator';
import { PlayIcon } from '../icons/PlayIcon';
import { PauseIcon } from '../icons/PauseIcon';
import { ArrowPathIcon } from '../icons/ArrowPathIcon';
import { LoadingSpinner } from '../LoadingSpinner';
import { Shape, Timeframe, TIMEFRAMES } from '../../context/LiveSimulatorContext';
import { CursorArrowRaysIcon } from '../icons/CursorArrowRaysIcon';
import { PencilIcon } from '../icons/PencilIcon';
import { MinusIcon } from '../icons/MinusIcon';
import { TrashIcon } from '../icons/TrashIcon';

const MAJOR_PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CAD', 'AUD/USD', 'NZD/USD', 'USD/CHF', 'XAU/USD'].sort();
const MAX_DATA_POINTS = 100;
type Tool = 'pan' | 'trendline' | 'horizontal';

interface ChartSVGProps {
    data: number[];
    shapes: Shape[];
    tempShapePoints: { x: number; y: number }[];
    viewBox: { x: number; y: number; width: number; height: number; };
    activeTool: Tool;
}

const ChartSVG = forwardRef<SVGSVGElement, ChartSVGProps>(({ data, shapes, tempShapePoints, viewBox, activeTool }, ref) => {
    const originalWidth = 500;
    const originalHeight = 200;
    const padding = 10;

    if (data.length < 2) {
        return <div className="w-full h-full flex items-center justify-center text-slate-500">Press play to start the simulation.</div>;
    }

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max > min ? max - min : (min * 0.01);

    const getX = (index: number) => (index / (MAX_DATA_POINTS - 1)) * (originalWidth - padding * 2) + padding;
    const getY = (value: number) => originalHeight - (((value - min) / range) * (originalHeight - padding * 2) + padding);

    const path = data
        .map((point, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(point)}`)
        .join(' ');
        
    const renderShape = (shape: { type: 'trendline' | 'horizontal', points: {x: number, y: number}[] }, key: number | string) => {
        const { type, points } = shape;
        if (points.length < 1) return null;
        const [start, end] = points;
        if (type === 'horizontal') {
            return <line key={key} x1={-10000} y1={start.y} x2={10000} y2={start.y} stroke="#facc15" strokeWidth="1" vectorEffect="non-scaling-stroke" />;
        }
        if (type === 'trendline' && end) {
            return <line key={key} x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="#facc15" strokeWidth="1" vectorEffect="non-scaling-stroke" />;
        }
        return null;
    };

    return (
        <svg ref={ref} viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`} className="w-full h-full" style={{ cursor: 'inherit' }}>
            <path d={path} fill="none" stroke="#06b6d4" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            {/* Render saved shapes */}
            {shapes.map((shape) => renderShape(shape, shape.id))}
            {/* Render temporary drawing shape */}
            {/* FIX: Removed the 'id' property from the temporary shape object literal to fix TypeScript error. */}
            {tempShapePoints.length > 0 && renderShape({type: activeTool as Exclude<Tool, 'pan'>, points: tempShapePoints}, 'temp')}
        </svg>
    );
});


export const LiveChartSimulatorView: React.FC = () => {
    const {
        simulationData,
        currentPair,
        isSimulating,
        isLoadingInitialPrice,
        error,
        timeframe,
        shapes,
        selectPair,
        toggleSimulation,
        resetSimulation,
        selectTimeframe,
        addShape,
        clearShapes,
    } = useLiveSimulator();

    const [activeTool, setActiveTool] = useState<Tool>('pan');
    const [drawingPoints, setDrawingPoints] = useState<{ x: number; y: number }[]>([]);

    const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 500, height: 200 });
    const [isPanning, setIsPanning] = useState(false);
    const [startPanPoint, setStartPanPoint] = useState({ x: 0, y: 0 });
    const svgContainerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!simulationData[currentPair] || simulationData[currentPair].length === 0) {
            selectPair(currentPair);
        }
    }, [currentPair, simulationData, selectPair]);

    useEffect(() => {
        resetView();
    }, [currentPair, timeframe]);

    const priceHistory = simulationData[currentPair] || [];
    
    const handlePairChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newPair = e.target.value;
        selectPair(newPair);
    };

    const handleReset = () => {
        resetSimulation(currentPair);
    };

    // --- Chart Interactivity ---
    const getSVGCoordinates = (e: React.MouseEvent): { x: number; y: number } | null => {
        const svg = svgRef.current;
        if (!svg) return null;

        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const screenCTM = svg.getScreenCTM();
        if (screenCTM) {
            return pt.matrixTransform(screenCTM.inverse());
        }
        return null;
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (activeTool === 'pan') {
            setIsPanning(true);
            setStartPanPoint({ x: e.clientX, y: e.clientY });
        } else {
            const coords = getSVGCoordinates(e);
            if (coords) setDrawingPoints([coords]);
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (activeTool === 'pan') {
            if (!isPanning || !svgContainerRef.current) return;
            const dx = e.clientX - startPanPoint.x;
            const dy = e.clientY - startPanPoint.y;
            const scaleX = viewBox.width / svgContainerRef.current.clientWidth;
            const scaleY = viewBox.height / svgContainerRef.current.clientHeight;
            setViewBox(prev => ({ ...prev, x: prev.x - dx * scaleX, y: prev.y - dy * scaleY }));
            setStartPanPoint({ x: e.clientX, y: e.clientY });
        } else if (drawingPoints.length > 0) {
            const coords = getSVGCoordinates(e);
            if (coords) {
                 if (activeTool === 'horizontal') {
                    setDrawingPoints([{...drawingPoints[0], y: coords.y}]);
                } else {
                    setDrawingPoints([drawingPoints[0], coords]);
                }
            }
        }
    };

    const handleMouseUpOrLeave = () => {
        if (activeTool === 'pan') {
            setIsPanning(false);
        } else if (drawingPoints.length > 0) {
            const finalPoints = activeTool === 'horizontal' ? [drawingPoints[0]] : drawingPoints;
            addShape({ id: Date.now(), type: activeTool, points: finalPoints });
            setDrawingPoints([]);
        }
    };

    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (!svgContainerRef.current) return;
        const zoomFactor = 1.1;
        const scale = e.deltaY < 0 ? 1 / zoomFactor : zoomFactor;
        const rect = svgContainerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const mouseRatioX = mouseX / rect.width;
        const mouseRatioY = mouseY / rect.height;
        const newWidth = viewBox.width * scale;
        const newHeight = viewBox.height * scale;
        const newX = viewBox.x + (mouseRatioX * viewBox.width) - (mouseRatioX * newWidth);
        const newY = viewBox.y + (mouseRatioY * viewBox.height) - (mouseRatioY * newHeight);
        setViewBox({ x: newX, y: newY, width: newWidth, height: newHeight });
    };
    
    const resetView = () => setViewBox({ x: 0, y: 0, width: 500, height: 200 });
    
    const cursorClass = useMemo(() => {
        if (activeTool === 'pan') return isPanning ? 'grabbing' : 'grab';
        return 'crosshair';
    }, [activeTool, isPanning]);

    const currentPrice = priceHistory.length > 0 ? priceHistory[priceHistory.length - 1] : 0;
    const lastPrice = priceHistory.length > 1 ? priceHistory[priceHistory.length - 2] : null;
    const priceChangeDirection = useMemo(() => {
        if (!lastPrice) return 'neutral';
        if (currentPrice > lastPrice) return 'up';
        if (currentPrice < lastPrice) return 'down';
        return 'neutral';
    }, [currentPrice, lastPrice]);

    const priceColorClass = { up: 'text-green-400', down: 'text-red-400', neutral: 'text-slate-200' }[priceChangeDirection];
    const decimalPlaces = (currentPair.includes('JPY') || currentPair.includes('XAU')) ? 3 : 5;

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">Live Chart Simulator</h1>
            <p className="text-slate-400 mb-8">Watch a simulated real-time price feed and practice your analysis as the chart unfolds.</p>
            
            <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg mb-6 space-y-4">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                    <div>
                        <label htmlFor="currency-pair" className="block text-sm font-medium text-slate-300 mb-1">Currency Pair</label>
                        <select id="currency-pair" value={currentPair} onChange={handlePairChange} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white font-semibold focus:ring-2 focus:ring-cyan-500">{MAJOR_PAIRS.map(p => (<option key={p} value={p}>{p}</option>))}</select>
                    </div>
                     <div className="flex items-center space-x-2">
                        <button onClick={toggleSimulation} className="flex-1 flex items-center justify-center py-2 px-4 bg-cyan-500 text-slate-900 font-bold rounded-md hover:bg-cyan-400"><mrowisSimulating ? <PauseIcon className="w-6 h-6 mr-2" /> : <PlayIcon className="w-6 h-6 mr-2" />}{isSimulating ? 'Pause' : 'Play'}</button>
                        <button onClick={handleReset} className="py-2 px-4 bg-slate-600 text-white font-semibold rounded-md hover:bg-slate-500"><ArrowPathIcon className="w-6 h-6" /></button>
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Timeframe</label>
                    <div className="flex items-center space-x-2 rounded-md bg-slate-700 p-1">{TIMEFRAMES.map(tf => (<button key={tf} onClick={() => selectTimeframe(tf)} className={`flex-1 text-center py-1 text-sm font-semibold rounded ${timeframe === tf ? 'bg-cyan-500 text-slate-900' : 'text-slate-300 hover:bg-slate-600'}`}>{tf.toUpperCase()}</button>))}</div>
                 </div>
            </div>

            {error && <p className="text-center text-sm text-yellow-400 mb-4 bg-yellow-500/10 p-2 rounded-md">{error}</p>}

            <div className="bg-slate-900/70 border border-slate-700 rounded-xl shadow-2xl p-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-3xl font-bold text-white">{currentPair}</h2>
                        <span className="text-sm text-slate-400">Timeframe: {timeframe.toUpperCase()}</span>
                    </div>
                    {isLoadingInitialPrice ? <div className="flex items-center gap-2"><LoadingSpinner /><span className="text-slate-400">Fetching live price...</span></div> : <div className={`text-4xl font-mono font-bold transition-colors duration-300 ${priceColorClass}`}>{currentPrice.toFixed(decimalPlaces)}</div>}
                </div>
                 <div className="flex gap-4">
                    {/* Drawing Toolbar */}
                    <div className="flex flex-col space-y-2 p-2 bg-slate-800 rounded-md border border-slate-700">
                        <button onClick={() => setActiveTool('pan')} title="Pan/Zoom" className={`p-2 rounded ${activeTool === 'pan' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:bg-slate-700'}`}><CursorArrowRaysIcon className="w-5 h-5" /></button>
                        <button onClick={() => setActiveTool('trendline')} title="Trendline" className={`p-2 rounded ${activeTool === 'trendline' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:bg-slate-700'}`}><PencilIcon className="w-5 h-5" /></button>
                        <button onClick={() => setActiveTool('horizontal')} title="Horizontal Line" className={`p-2 rounded ${activeTool === 'horizontal' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:bg-slate-700'}`}><MinusIcon className="w-5 h-5" /></button>
                        <div className="border-t border-slate-700 my-1"></div>
                        <button onClick={clearShapes} title="Clear Drawings" className="p-2 rounded text-red-400 hover:bg-red-500/20"><TrashIcon className="w-5 h-5" /></button>
                    </div>
                     <div ref={svgContainerRef} className="flex-1 h-52 bg-slate-800/50 rounded-lg overflow-hidden" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUpOrLeave} onMouseLeave={handleMouseUpOrLeave} onWheel={handleWheel} style={{ cursor: cursorClass }}>
                       {isLoadingInitialPrice 
                            ? <div className="w-full h-full flex items-center justify-center text-slate-500">Initializing chart...</div> 
                            : <ChartSVG 
                                ref={svgRef}
                                data={priceHistory} 
                                shapes={shapes} 
                                tempShapePoints={drawingPoints} 
                                viewBox={viewBox} 
                                activeTool={activeTool} 
                              />
                        }
                    </div>
                </div>
                 <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-slate-500">Scroll to zoom, click and drag to pan.</p>
                    <button onClick={resetView} className="text-xs text-slate-400 hover:text-white hover:underline">Reset View</button>
                </div>
            </div>
            
             <div className="mt-4 text-center text-sm text-slate-500">
                <p>This is a simulated price feed that starts from the current real-time market price.</p>
            </div>
        </div>
    );
};