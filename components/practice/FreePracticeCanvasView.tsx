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
import { RectangleIcon } from '../icons/RectangleIcon';
import { CircleIcon } from '../icons/CircleIcon';
import { ArrowUturnLeftIcon } from '../icons/ArrowUturnLeftIcon';
import { ArrowUturnRightIcon } from '../icons/ArrowUturnRightIcon';
import { BoldIcon } from '../icons/BoldIcon';
import { ItalicIcon } from '../icons/ItalicIcon';
import { useApiKey } from '../../hooks/useApiKey';

type Tool = 'select' | 'trendline' | 'horizontal' | 'fibonacci' | 'text' | 'angle' | 'rectangle' | 'circle';

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
  // Text styling
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'italic' | 'normal';
  rotation?: number; // in degrees
};

type Interaction =
  | { type: 'none' }
  | { type: 'drawing' }
  | { type: 'moving'; id: number }
  | { type: 'resizing'; id: number; handle: 'start' | 'end' }
  | { type: 'rotating'; id: number; center: { x: number; y: number } };

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

const isPointOnLine = (p: {x:number, y:number}, start: {x:number, y:number}, end: {x:number, y:number}, tolerance: number = HIT_TOLERANCE) => {
    const lineLen = distance(start, end);
    if (lineLen === 0) return distance(p, start) < tolerance;

    const dot = (((p.x - start.x) * (end.x - start.x)) + ((p.y - start.y) * (end.y - start.y))) / (lineLen ** 2);
    const closestX = start.x + (dot * (end.x - start.x));
    const closestY = start.y + (dot * (end.y - start.y));
    
    const onSegment = dot >= 0 && dot <= 1;
    if (!onSegment) {
        const distToStart = distance(p, start);
        const distToEnd = distance(p, end);
        return Math.min(distToStart, distToEnd) < tolerance;
    }
    
    const dist = distance(p, {x: closestX, y: closestY});
    return dist < tolerance;
};

const getNormalizedRect = (p1: {x:number, y:number}, p2: {x:number, y:number}) => {
    const x = Math.min(p1.x, p2.x);
    const y = Math.min(p1.y, p2.y);
    const width = Math.abs(p1.x - p2.x);
    const height = Math.abs(p1.y - p2.y);
    return { x, y, width, height };
}

const getShapeAtPosition = (coords: {x: number, y: number}, shapes: Shape[], ctx: CanvasRenderingContext2D): Shape | null => {
    for (let i = shapes.length - 1; i >= 0; i--) {
        const shape = shapes[i];
        if (!shape.points || shape.points.length < 1) continue;
        const [start, end] = shape.points;
        switch(shape.type) {
            case 'trendline':
            case 'fibonacci':
            case 'angle':
                if (end && isPointOnLine(coords, start, end)) return shape;
                break;
            case 'horizontal':
                if (isPointOnLine(coords, {x:0, y:start.y}, {x:ctx.canvas.width, y:start.y})) return shape;
                break;
            case 'text': {
                if (!shape.text) continue;
                const [center] = shape.points;
                ctx.font = `${shape.fontStyle || 'normal'} ${shape.fontWeight || 'normal'} ${shape.fontSize}px sans-serif`;
                const textWidth = ctx.measureText(shape.text).width;
                const textHeight = shape.fontSize;

                // Create a virtual unrotated point to test against the rotated box
                const angleRad = -(shape.rotation || 0) * Math.PI / 180;
                const s = Math.sin(angleRad);
                const c = Math.cos(angleRad);
                const translatedX = coords.x - center.x;
                const translatedY = coords.y - center.y;

                const rotatedX = translatedX * c - translatedY * s;
                const rotatedY = translatedX * s + translatedY * c;

                if (Math.abs(rotatedX) <= textWidth / 2 && Math.abs(rotatedY) <= textHeight / 2) {
                    return shape;
                }
                break;
            }
            case 'rectangle': {
                if (!end) continue;
                const { x, y, width, height } = getNormalizedRect(start, end);
                const topLeft = { x, y };
                const topRight = { x: x + width, y };
                const bottomLeft = { x, y: y + height };
                const bottomRight = { x: x + width, y: y + height };
                if (isPointOnLine(coords, topLeft, topRight) ||
                    isPointOnLine(coords, topRight, bottomRight) ||
                    isPointOnLine(coords, bottomRight, bottomLeft) ||
                    isPointOnLine(coords, bottomLeft, topLeft)) {
                    return shape;
                }
                break;
            }
            case 'circle': {
                if (!end) continue;
                const [center] = shape.points;
                const radius = distance(start, end);
                const distFromCenter = distance(coords, center);
                if (Math.abs(distFromCenter - radius) < HIT_TOLERANCE) {
                    return shape;
                }
                break;
            }
        }
    }
    return null;
}

const getHandleAtPosition = (coords: {x: number, y: number}, shape: Shape): 'start' | 'end' | 'rotate' | null => {
    if (shape.type === 'text') {
        const [center] = shape.points;
        
        // Rotation handle check
        const rotationHandleOffset = shape.fontSize + 10;
        const angleRad = ((shape.rotation || 0) - 90) * Math.PI / 180;
        const handleX = center.x + Math.cos(angleRad) * rotationHandleOffset;
        const handleY = center.y + Math.sin(angleRad) * rotationHandleOffset;
        if (distance(coords, {x: handleX, y: handleY}) < RESIZE_HANDLE_SIZE) {
            return 'rotate';
        }

        // Move handle check (center)
        if (distance(coords, center) < RESIZE_HANDLE_SIZE) {
            return 'start'; // Using 'start' to mean the primary point/move handle
        }
    } else {
        const [start, end] = shape.points;
        if (distance(coords, start) < RESIZE_HANDLE_SIZE) return 'start';
        if (end && distance(coords, end) < RESIZE_HANDLE_SIZE) return 'end';
    }
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
  const [textStyle, setTextStyle] = useState({ bold: false, italic: false });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [shapes, setShapes] = useState<Shape[]>([]);
  const [history, setHistory] = useState<Shape[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [drawingPoints, setDrawingPoints] = useState<{x: number, y: number}[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<number | null>(null);

  const [interaction, setInteraction] = useState<Interaction>({ type: 'none' });
  const dragStartPointRef = useRef({x: 0, y: 0});
  
  const [fibLevels, setFibLevels] = useState<FibLevel[]>(DEFAULT_FIB_LEVELS);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  
  const { apiKey, openKeyModal } = useApiKey();

  const commitHistory = (newShapes: Shape[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newShapes);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setShapes(history[newIndex]);
      setSelectedShapeId(null);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setShapes(history[newIndex]);
      setSelectedShapeId(null);
    }
  }, [history, historyIndex]);

  const handleGenerateChart = async () => {
    if (!apiKey) {
      setError('Please set your Gemini API key to generate charts.');
      openKeyModal();
      return;
    }
    setIsLoading(true);
    setImageUrl('');
    setError(null);
    setShapes([]);
    setSelectedShapeId(null);
    setHistory([[]]);
    setHistoryIndex(0);
    try {
      const prompt = "A random, unlabeled forex candlestick chart on a dark theme, in a 16:9 aspect ratio. The chart should display a variety of price action, suitable for technical analysis practice.";
      const url = await generateChartImage(apiKey, prompt);
      setImageUrl(url);
    } catch (e) { console.error(e); setError('Failed to generate a practice chart. Please check your API key and try again.'); } 
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
            if (handle === 'rotate') {
                setInteraction({ type: 'rotating', id: selectedShape.id, center: selectedShape.points[0] });
                return;
            }
            if (handle === 'start' || handle === 'end') {
                // For text, 'start' handle is move
                if (selectedShape.type === 'text' && handle === 'start') {
                    setInteraction({ type: 'moving', id: selectedShape.id });
                } else {
                    setInteraction({ type: 'resizing', id: selectedShape.id, handle });
                }
                return;
            }
        }

        const shapeToSelect = getShapeAtPosition(coords, shapes, canvasRef.current!.getContext('2d')!);
        if (shapeToSelect) {
            setSelectedShapeId(shapeToSelect.id);
            if (shapeToSelect.type === 'text') {
                 setInteraction({ type: 'moving', id: shapeToSelect.id });
            } else {
                 setInteraction({ type: 'moving', id: shapeToSelect.id });
            }
        } else {
            setSelectedShapeId(null);
            setInteraction({ type: 'none' });
        }
    } else { // Drawing tools
        setInteraction({ type: 'drawing' });
        setSelectedShapeId(null);
        setDrawingPoints([coords]);

        if (activeTool === 'text') {
            const text = prompt('Enter text annotation:');
            if (text) {
                const newShape: Shape = { 
                    id: Date.now(), 
                    type: 'text', 
                    color: activeColor, 
                    points: [coords], 
                    text, 
                    lineWidth, 
                    fontSize,
                    fontWeight: textStyle.bold ? 'bold' : 'normal',
                    fontStyle: textStyle.italic ? 'italic' : 'normal',
                    rotation: 0,
                };
                const newShapes = [...shapes, newShape];
                setShapes(newShapes);
                commitHistory(newShapes);
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

                // Special case: moving a circle by its center handle moves the whole shape
                if (s.type === 'circle' && interaction.handle === 'start') {
                    const originalCenter = s.points[0];
                    const originalEdge = s.points[1];
                    const moveDx = coords.x - originalCenter.x;
                    const moveDy = coords.y - originalCenter.y;
                    const newPoints = [
                        coords, // new center
                        { x: originalEdge.x + moveDx, y: originalEdge.y + moveDy } // new edge, preserving radius
                    ];
                    return { ...s, points: newPoints };
                }

                // Default behavior for all other handles/shapes
                const newPoints = [...s.points];
                if (interaction.handle === 'start') newPoints[0] = coords;
                else newPoints[1] = coords;
                return { ...s, points: newPoints };
            }));
            break;
        case 'rotating':
            const angle = Math.atan2(coords.y - interaction.center.y, coords.x - interaction.center.x) * (180 / Math.PI);
            setShapes(prevShapes => prevShapes.map(s => s.id === interaction.id
                ? { ...s, rotation: angle + 90 } // +90 to offset the 'above' position
                : s
            ));
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
      const newShapes = [...shapes, newShape];
      setShapes(newShapes);
      commitHistory(newShapes);
    } else if (interaction.type === 'moving' || interaction.type === 'resizing' || interaction.type === 'rotating') {
      commitHistory(shapes);
    }
    setInteraction({ type: 'none' });
    setDrawingPoints([]);
  };

  const drawShape = (ctx: CanvasRenderingContext2D, shape: Shape) => {
    ctx.strokeStyle = shape.color;
    ctx.fillStyle = shape.color;
    ctx.lineWidth = shape.lineWidth;
    ctx.setLineDash([]);
    ctx.globalAlpha = 1.0;
    const [start, end] = shape.points;
    if (!start) return;

    switch (shape.type) {
      case 'trendline':
        if (!end) return;
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
        const [center] = shape.points;
        if (!center) return;
        ctx.save();
        ctx.translate(center.x, center.y);
        ctx.rotate((shape.rotation || 0) * Math.PI / 180);
        ctx.font = `${shape.fontStyle || 'normal'} ${shape.fontWeight || 'normal'} ${shape.fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(shape.text || '', 0, 0);
        ctx.restore();
        break;
      case 'angle':
        if (!end) return;
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
        if (!end) return;
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
      case 'rectangle': {
        if (!end) return;
        const { x, y, width, height } = getNormalizedRect(start, end);
        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.stroke();
        break;
      }
      case 'circle': {
        if (!end) return;
        const radius = distance(start, end);
        ctx.beginPath();
        ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
        break;
      }
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

        if (selectedShape.type === 'text') {
            const [center] = selectedShape.points;
            
            const rotationHandleOffset = selectedShape.fontSize + 10;
            const angleRad = ((selectedShape.rotation || 0) - 90) * Math.PI / 180;
            const handleX = center.x + Math.cos(angleRad) * rotationHandleOffset;
            const handleY = center.y + Math.sin(angleRad) * rotationHandleOffset;

            ctx.beginPath();
            ctx.moveTo(center.x, center.y);
            ctx.lineTo(handleX, handleY);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(handleX, handleY, RESIZE_HANDLE_SIZE / 2, 0, 2 * Math.PI);
            ctx.fill();

            ctx.beginPath();
            ctx.rect(center.x - RESIZE_HANDLE_SIZE / 2, center.y - RESIZE_HANDLE_SIZE / 2, RESIZE_HANDLE_SIZE, RESIZE_HANDLE_SIZE);
            ctx.fill();

        } else {
             selectedShape.points.forEach(p => {
                if(!p) return;
                ctx.beginPath();
                ctx.rect(p.x - RESIZE_HANDLE_SIZE / 2, p.y - RESIZE_HANDLE_SIZE / 2, RESIZE_HANDLE_SIZE, RESIZE_HANDLE_SIZE);
                ctx.fill();
            });
        }
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
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'z') {
                e.preventDefault();
                handleUndo();
            } else if (e.key === 'y' || (e.key === 'Z' && e.shiftKey)) {
                e.preventDefault();
                handleRedo();
            }
            return;
        }

        if((e.key === 'Delete' || e.key === 'Backspace') && selectedShapeId !== null) {
            const newShapes = shapes.filter(s => s.id !== selectedShapeId);
            setShapes(newShapes);
            setSelectedShapeId(null);
            commitHistory(newShapes);
        }
        if (e.key === 'Escape' && isModalOpen) {
            setIsModalOpen(false);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedShapeId, isModalOpen, handleUndo, handleRedo, shapes]);

  const clearDrawings = () => { 
    setShapes([]); 
    setSelectedShapeId(null); 
    commitHistory([]);
  };

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
  const isTextSelected = selectedShape?.type === 'text';
  const isFibSelected = selectedShape?.type === 'fibonacci';
  const isFibToolActive = activeTool === 'fibonacci';
  
  const handleUpdateSelectedFibLevels = (newLevels: FibLevel[]) => {
      if (!selectedShapeId) return;
      setShapes(prevShapes => {
        const newShapes = prevShapes.map(s => {
            if (s.id === selectedShapeId && s.type === 'fibonacci') {
                return { ...s, levels: newLevels };
            }
            return s;
        });
        commitHistory(newShapes);
        return newShapes;
      });
  };

  const handleToggleTextStyle = (style: 'bold' | 'italic') => {
      if (isTextSelected) {
          const property = style === 'bold' ? 'fontWeight' : 'fontStyle';
          const onValue = style;
          const offValue = 'normal';
          const newShapes = shapes.map(s => 
              s.id === selectedShapeId ? { ...s, [property]: s[property] === onValue ? offValue : onValue } : s
          );
          setShapes(newShapes);
          commitHistory(newShapes);
      } else {
          setTextStyle(prev => ({ ...prev, [style]: !prev[style] }));
      }
  };

  const isBoldActive = (isTextSelected && selectedShape.fontWeight === 'bold') || (!isTextSelected && activeTool === 'text' && textStyle.bold);
  const isItalicActive = (isTextSelected && selectedShape.fontStyle === 'italic') || (!isTextSelected && activeTool === 'text' && textStyle.italic);
  
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
                    <ToolButton tool="rectangle" label="Rectangle"><RectangleIcon className="w-5 h-5" /></ToolButton>
                    <ToolButton tool="circle" label="Circle"><CircleIcon className="w-5 h-5" /></ToolButton>
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
                     <button onClick={() => handleToggleTextStyle('bold')} title="Bold" disabled={activeTool !== 'text' && !isTextSelected} className={`p-2 rounded-md transition-colors disabled:text-gray-600 disabled:cursor-not-allowed ${isBoldActive ? 'bg-cyan-500/20 text-cyan-300' : 'hover:bg-gray-700 text-gray-400'}`}>
                        <BoldIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleToggleTextStyle('italic')} title="Italic" disabled={activeTool !== 'text' && !isTextSelected} className={`p-2 rounded-md transition-colors disabled:text-gray-600 disabled:cursor-not-allowed ${isItalicActive ? 'bg-cyan-500/20 text-cyan-300' : 'hover:bg-gray-700 text-gray-400'}`}>
                        <ItalicIcon className="w-5 h-5" />
                    </button>
                    <div className="w-px h-6 bg-gray-600 mx-2"></div>
                    <button onClick={handleUndo} disabled={historyIndex <= 0} title="Undo (Ctrl+Z)" className="p-2 rounded-md disabled:text-gray-600 disabled:cursor-not-allowed hover:bg-gray-700 text-gray-400 transition-colors">
                        <ArrowUturnLeftIcon className="w-5 h-5" />
                    </button>
                    <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} title="Redo (Ctrl+Y)" className="p-2 rounded-md disabled:text-gray-600 disabled:cursor-not-allowed hover:bg-gray-700 text-gray-400 transition-colors">
                        <ArrowUturnRightIcon className="w-5 h-5" />
                    </button>
                    <div className="w-px h-6 bg-gray-600 mx-2"></div>
                    <button onClick={clearDrawings} title="Clear Drawings" className="p-2 rounded-md hover:bg-red-500/20 text-red-400 transition-colors"><TrashIcon className="w-5 h-5" /></button>
                </div>
                
                {(isFibSelected || isFibToolActive) && (
                    <FibonacciSettings
                        levels={levelsForSettings}
                        setLevels={isFibToolActive ? setFibLevels : handleUpdateSelectedFibLevels}
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
