import React, { useState, useRef, useEffect, useCallback } from 'react';
import { generateChartImage } from '../../services/geminiService';
import { LoadingSpinner } from '../LoadingSpinner';
import { PhotoIcon } from '../icons/PhotoIcon';
import { PencilIcon } from '../icons/PencilIcon';
import { MinusIcon } from '../icons/MinusIcon';
import { FibonacciIcon } from '../icons/FibonacciIcon';
import { ChatBubbleLeftIcon } from '../icons/ChatBubbleLeftIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { CursorArrowRaysIcon } from '../icons/CursorArrowRaysIcon';
import { FibonacciSettings } from './FibonacciSettings';
import { AngleIcon } from '../icons/AngleIcon';
import { ArrowsPointingOutIcon } from '../icons/ArrowsPointingOutIcon';
import { XMarkIcon } from '../icons/XMarkIcon';

type Tool = 'select' | 'trendline' | 'horizontal' | 'fibonacci' | 'text' | 'angle';

export interface FibLevel {
  level: number;
  enabled: boolean;
}

type Shape = {
  id: number;
  type: Exclude<Tool, 'select'>;
  color: string;
  points: { x: number; y: number }[];
  text?: string;
  lineWidth: number;
  fontSize: number;
  levels?: FibLevel[];
};

type Interaction =
  | { type: 'none' }
  | { type: 'drawing' }
  | { type: 'moving'; id: number }
  | { type: 'resizing'; id: number; handle: 'start' | 'end' };

const COLORS = ['#34d399', '#f87171', '#60a5fa', '#facc15', '#a78bfa'];
const RESIZE_HANDLE_SIZE = 8;
const HIT_TOLERANCE = 10;
const DEFAULT_FIB_LEVELS: FibLevel[] = [
  { level: 0, enabled: true },
  { level: 0.236, enabled: true },
  { level: 0.382, enabled: true },
  { level: 0.5, enabled: true },
  { level: 0.618, enabled: true },
  { level: 0.786, enabled: true },
  { level: 1, enabled: true },
];

// --- Helper Functions for Geometry and Hit Detection ---

const distance = (p1: {x:number, y:number}, p2: {x:number, y:number}) => Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);

const isPointOnLine = (p: {x:number, y:number}, start: {x:number, y:number}, end: {x:number, y:number}) => {
    const d1 = distance(p, start);
    const d2 = distance(p, end);
    const lineLen = distance(start, end);
    return Math.abs(d1 + d2 - lineLen) < HIT_TOLERANCE / 2;
};

const getShapeAtPosition = (coords: {x: number, y: number}, shapes: Shape[], ctx: CanvasRenderingContext2D): Shape | null => {
    // Iterate backwards to select top-most shape first
    for (let i = shapes.length - 1; i >= 0; i--) {
        const shape = shapes[i];
        const [start, end] = shape.points;
        switch(shape.type) {
            case 'trendline':
            case 'fibonacci':
            case 'angle':
                if (isPointOnLine(coords, start, end!)) return shape;
                break;
            case 'horizontal':
                if (Math.abs(coords.y - start.y) < HIT_TOLERANCE) return shape;
                break;
            case 'text':
                if (!shape.text) continue;
                ctx.font = `${shape.fontSize}px sans-serif`;
                const textWidth = ctx.measureText(shape.text).width;
                if (coords.x >= start.x && coords.x <= start.x + textWidth && coords.y >= start.y - shape.fontSize && coords.y <= start.y) {
                    return shape;
                }
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

export const FreePracticeCanvasView: React.FC = () => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [activeColor, setActiveColor] = useState<string>(COLORS[0]);
  const [lineWidth, setLineWidth] = useState(2);
  const [fontSize, setFontSize] = useState(16);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [shapes, setShapes] = useState<Shape[]>([]);
  const [drawingPoints, setDrawingPoints] = useState<{x: number, y: number}[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<number | null>(null);

  const [interaction, setInteraction] = useState<Interaction>({ type: 'none' });
  const dragStartPointRef = useRef({x: 0, y: 0});
  
  const [fibLevels, setFibLevels] = useState<FibLevel[]>(DEFAULT_FIB_LEVELS);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const handleGenerateChart = async () => {
    setIsLoading(true);
    setImageUrl('');
    setError(null);
    setShapes([]);
    setSelectedShapeId(null);
    try {
      const prompt = "A random, unlabeled forex candlestick chart on a dark theme, in a 16:9 aspect ratio. The chart should display a variety of price action, suitable for technical analysis practice.";
      const url = await generateChartImage(prompt);
      setImageUrl(url);
    } catch (e) { console.error(e); setError('Failed to generate a practice chart. Please try again.'); } 
    finally { setIsLoading(false); }
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

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(e);
    if (!coords) return;
    
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

        const shapeToSelect = getShapeAtPosition(coords, shapes, canvasRef.current!.getContext('2d')!);
        if (shapeToSelect) {
            setSelectedShapeId(shapeToSelect.id);
            setInteraction({ type: 'moving', id: shapeToSelect.id });
        } else {
            setSelectedShapeId(null);
        }
    } else { // Drawing tools
        setInteraction({ type: 'drawing' });
        setSelectedShapeId(null);
        setDrawingPoints([coords]);

        if (activeTool === 'text') {
            const text = prompt('Enter text annotation:');
            if (text) {
                const newShape: Shape = { id: Date.now(), type: 'text', color: activeColor, points: [coords], text, lineWidth, fontSize };
                setShapes(prev => [...prev, newShape]);
            }
            setInteraction({type: 'none'});
            setDrawingPoints([]);
        }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(e);
    if (!coords) return;
    
    const dx = coords.x - dragStartPointRef.current.x;
    const dy = coords.y - dragStartPointRef.current.y;

    switch (interaction.type) {
        case 'drawing':
            if (drawingPoints.length > 0) {
                setDrawingPoints([drawingPoints[0], coords]);
            }
            break;
        case 'moving':
            setShapes(prevShapes => prevShapes.map(s => s.id === interaction.id
                ? { ...s, points: s.points.map(p => ({ x: p.x + dx, y: p.y + dy })) }
                : s
            ));
            dragStartPointRef.current = coords;
            break;
        case 'resizing':
             setShapes(prevShapes => prevShapes.map(s => {
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
    if (interaction.type === 'drawing' && drawingPoints.length > 1) {
      const newShape: Shape = {
        id: Date.now(),
        type: activeTool as Exclude<Tool, 'select'>,
        color: activeColor,
        points: drawingPoints,
        lineWidth,
        fontSize,
        ...(activeTool === 'fibonacci' && { levels: fibLevels }),
      };
      setShapes(prev => [...prev, newShape]);
    }
    setInteraction({ type: 'none' });
    setDrawingPoints([]);
  };

  const drawShape = (ctx: CanvasRenderingContext2D, shape: Shape) => {
    ctx.strokeStyle = shape.color;
    ctx.fillStyle = shape.color;
    ctx.lineWidth = shape.lineWidth;
    ctx.font = `${shape.fontSize}px sans-serif`;
    ctx.setLineDash([]);
    ctx.globalAlpha = 1.0;
    const [start, end] = shape.points;
    if (!end) return;

    switch (shape.type) {
      case 'trendline':
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        break;
      case 'horizontal':
        ctx.beginPath();
        ctx.moveTo(0, start.y);
        ctx.lineTo(ctx.canvas.width, start.y);
        ctx.stroke();
        break;
      case 'text':
        ctx.fillText(shape.text || '', start.x, start.y);
        break;
      case 'angle':
        // Draw the main line
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        
        // Draw horizontal reference line
        ctx.setLineDash([3, 3]);
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, start.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1.0;

        // Calculate and draw angle text
        const angle = Math.atan2(start.y - end.y, end.x - start.x) * (180 / Math.PI);
        ctx.font = `14px sans-serif`;
        const text = `${angle.toFixed(1)}°`;
        const textX = (start.x + end.x) / 2 + 10;
        const textY = (start.y + end.y) / 2 - 10;
        ctx.fillText(text, textX, textY);
        break;
      case 'fibonacci':
        const y1 = start.y;
        const y2 = end.y;
        const range = y2 - y1;
        const levelsToDraw = shape.levels?.filter(l => l.enabled) ?? [];

        ctx.lineWidth = shape.lineWidth;
        ctx.setLineDash([5, 3]);
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.7;

        levelsToDraw.forEach(({ level }) => {
            const levelY = y1 + range * level;
            
            ctx.beginPath();
            ctx.moveTo(0, levelY);
            ctx.lineTo(ctx.canvas.width, levelY);
            ctx.stroke();

            ctx.font = `12px sans-serif`;
            ctx.fillText(level.toFixed(3), start.x + 5, levelY - 2);
        });
        
        ctx.globalAlpha = 1.0;
        break;
    }
  };

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (imageRef.current?.complete) ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
    
    shapes.forEach(shape => drawShape(ctx, shape));
    
    if (interaction.type === 'drawing' && drawingPoints.length > 1) {
        const tempShape: Shape = {
            id: 0,
            type: activeTool as Exclude<Tool, 'select'>,
            color: activeColor,
            points: drawingPoints,
            lineWidth,
            fontSize,
            ...(activeTool === 'fibonacci' && { levels: fibLevels }),
        };
        drawShape(ctx, tempShape);
    }

    const selectedShape = shapes.find(s => s.id === selectedShapeId);
    if(selectedShape) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.fillStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        selectedShape.points.forEach(p => {
            if(!p) return;
            ctx.beginPath();
            ctx.rect(p.x - RESIZE_HANDLE_SIZE / 2, p.y - RESIZE_HANDLE_SIZE / 2, RESIZE_HANDLE_SIZE, RESIZE_HANDLE_SIZE);
            ctx.fill();
        })
    }
  }, [shapes, interaction.type, drawingPoints, activeTool, activeColor, lineWidth, fontSize, selectedShapeId, fibLevels]);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => { imageRef.current = img; redrawCanvas(); };
  }, [imageUrl, redrawCanvas]);

  useEffect(() => { redrawCanvas(); }, [shapes, redrawCanvas, isModalOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if((e.key === 'Delete' || e.key === 'Backspace') && selectedShapeId !== null) {
            setShapes(prev => prev.filter(s => s.id !== selectedShapeId));
            setSelectedShapeId(null);
        }
        if (e.key === 'Escape' && isModalOpen) {
            setIsModalOpen(false);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedShapeId, isModalOpen]);

  const clearDrawings = () => { setShapes([]); setSelectedShapeId(null); };

  const ToolButton: React.FC<{ tool: Tool; label: string; children: React.ReactNode }> = ({ tool, label, children }) => (
     <button onClick={() => setActiveTool(tool)} title={label} aria-label={label}
        className={`p-2 rounded-md transition-colors ${activeTool === tool ? 'bg-cyan-500/20 text-cyan-300' : 'hover:bg-gray-700 text-gray-400'}`}>
        {children}
    </button>
  );

  const SizeButton: React.FC<{ size: number, setSize: (s:number)=>void, currentSize: number, label: string }> = ({ size, setSize, currentSize, label}) => (
    <button onClick={() => setSize(size)} className={`w-6 h-6 text-xs rounded transition-colors ${currentSize === size ? 'bg-cyan-500/20 text-cyan-300' : 'hover:bg-gray-700 text-gray-400'}`}>
      {label}
    </button>
  );

  const selectedShape = shapes.find(s => s.id === selectedShapeId);
  const isFibSelected = selectedShape?.type === 'fibonacci';
  const isFibToolActive = activeTool === 'fibonacci';
  
  const handleUpdateSelectedFibLevels = (newLevels: FibLevel[]) => {
      if (!selectedShapeId) return;
      setShapes(prevShapes => prevShapes.map(s => {
          if (s.id === selectedShapeId && s.type === 'fibonacci') {
              return { ...s, levels: newLevels };
          }
          return s;
      }));
  };
  
  const levelsForSettings = isFibSelected ? (selectedShape.levels || DEFAULT_FIB_LEVELS) : fibLevels;
  const setLevelsForSettings = isFibSelected ? handleUpdateSelectedFibLevels : setFibLevels;

  const canvasElement = (
    <canvas 
      ref={canvasRef} 
      width={1280} 
      height={720} 
      className="w-full h-full"
      onMouseDown={handleMouseDown} 
      onMouseMove={handleMouseMove} 
      onMouseUp={handleMouseUp} 
      onMouseLeave={handleMouseUp}
      style={{ cursor: activeTool === 'select' ? 'default' : 'crosshair' }}
    />
  );

  return (
    <div className="max-w-7xl mx-auto flex flex-col items-center">
      <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">Free Practice Canvas</h1>
      <p className="text-gray-400 mb-6">Generate an AI chart and use the tools to practice your analysis.</p>

      {!imageUrl && !isLoading && (
         <div className="w-full text-center py-10">
            <button onClick={handleGenerateChart} className="px-6 py-3 bg-cyan-500 text-gray-900 font-semibold rounded-lg shadow-md hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 transition-all duration-200 text-lg">
                Generate New Practice Chart
            </button>
         </div>
      )}

      {isLoading && <div className="w-full aspect-video bg-gray-800/50 rounded-lg border border-gray-700 flex flex-col items-center justify-center p-4"><LoadingSpinner /><span className="mt-2 text-sm text-gray-400">AI is drawing a fresh chart for you...</span></div>}
      
      {error && <div className="mt-6 bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg text-center">{error}</div>}

      {imageUrl && !isLoading && (
        <>
            <div className={`w-full flex-col items-center ${isModalOpen ? 'hidden' : 'flex'}`}>
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

                <div className="mt-4 p-2 bg-gray-800 rounded-lg border border-gray-700 flex items-center space-x-2 flex-wrap justify-center">
                    <ToolButton tool="select" label="Select & Move"><CursorArrowRaysIcon className="w-5 h-5" /></ToolButton>
                    <ToolButton tool="trendline" label="Trendline"><PencilIcon className="w-5 h-5" /></ToolButton>
                    <ToolButton tool="horizontal" label="Horizontal Ray"><MinusIcon className="w-5 h-5" /></ToolButton>
                    <ToolButton tool="fibonacci" label="Fibonacci Retracement"><FibonacciIcon className="w-5 h-5" /></ToolButton>
                    <ToolButton tool="angle" label="Angle Measurement"><AngleIcon className="w-5 h-5" /></ToolButton>
                    <ToolButton tool="text" label="Text Annotation"><ChatBubbleLeftIcon className="w-5 h-5" /></ToolButton>
                    <div className="w-px h-6 bg-gray-600 mx-2"></div>
                    {COLORS.map(color => <button key={color} onClick={() => setActiveColor(color)} className={`w-6 h-6 rounded-full transition-transform duration-150 ${activeColor === color ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-white' : 'scale-90 hover:scale-100'}`} style={{ backgroundColor: color }} aria-label={`Select color ${color}`}/>)}
                    <div className="w-px h-6 bg-gray-600 mx-2"></div>
                    <div className="text-gray-400 text-xs mr-1">Line:</div>
                    <SizeButton size={1} setSize={setLineWidth} currentSize={lineWidth} label="S" />
                    <SizeButton size={2} setSize={setLineWidth} currentSize={lineWidth} label="M" />
                    <SizeButton size={4} setSize={setLineWidth} currentSize={lineWidth} label="L" />
                    <div className="w-px h-6 bg-gray-600 mx-2"></div>
                    <div className="text-gray-400 text-xs mr-1">Text:</div>
                    <SizeButton size={14} setSize={setFontSize} currentSize={fontSize} label="S" />
                    <SizeButton size={18} setSize={setFontSize} currentSize={fontSize} label="M" />
                    <SizeButton size={24} setSize={setFontSize} currentSize={fontSize} label="L" />
                    <div className="w-px h-6 bg-gray-600 mx-2"></div>
                    <button onClick={clearDrawings} title="Clear Drawings" className="p-2 rounded-md hover:bg-red-500/20 text-red-400 transition-colors"><TrashIcon className="w-5 h-5" /></button>
                </div>
                
                {(isFibSelected || isFibToolActive) && (
                    <FibonacciSettings
                        levels={levelsForSettings}
                        setLevels={setLevelsForSettings}
                    />
                )}
                
                <button onClick={handleGenerateChart} className="mt-4 px-4 py-2 bg-gray-700 text-gray-200 text-sm font-semibold rounded-lg shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 transition-all duration-200">
                    Generate Another Chart
                </button>
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
      )}
    </div>
  );
};
