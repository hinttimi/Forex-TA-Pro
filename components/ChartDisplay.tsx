import React, { useState, useEffect, useRef } from 'react';
import { PhotoIcon } from './icons/PhotoIcon';
import { ArrowsPointingOutIcon } from './icons/ArrowsPointingOutIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { ArrowPathIcon } from './icons/ArrowPathIcon';
import { ChartSkeleton } from './ChartSkeleton';

interface ChartDisplayProps {
  imageUrl: string;
  isLoading: boolean;
  loadingText?: string;
  containerClassName?: string;
}

export const ChartDisplay: React.FC<ChartDisplayProps> = ({ 
  imageUrl, 
  isLoading,
  loadingText = "AI is drawing the chart, please wait...",
  containerClassName = "mt-6 w-full aspect-video bg-[--color-dark-matter] rounded-lg border border-[--color-border] flex items-center justify-center p-4" 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPanPosition, setStartPanPosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);

  const resetTransform = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };
  
  const handleOpenModal = () => {
    resetTransform();
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomIntensity = 0.1;
    const newScale = scale - e.deltaY * zoomIntensity * 0.1;
    const minScale = 0.5;
    const maxScale = 5;

    const clampedScale = Math.max(minScale, Math.min(newScale, maxScale));

    if (imageRef.current) {
        const rect = imageRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const newX = mouseX - (mouseX - position.x) * (clampedScale / scale);
        const newY = mouseY - (mouseY - position.y) * (clampedScale / scale);

        setScale(clampedScale);
        setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsPanning(true);
    setStartPanPosition({
        x: e.clientX - position.x,
        y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
        const newX = e.clientX - startPanPosition.x;
        const newY = e.clientY - startPanPosition.y;
        setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUpOrLeave = () => {
    setIsPanning(false);
  };
  
  const Placeholder = () => (
      <div className="relative w-full h-full flex flex-col items-center justify-center text-center text-[--color-muted-grey]">
        <div className="absolute inset-0 overflow-hidden rounded-md">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(51, 56, 71, 0.5)" strokeWidth="1"/>
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
        </div>
        <div className="relative z-10">
            <PhotoIcon className="w-16 h-16 mx-auto mb-2 opacity-50" />
            <p>Your generated chart will appear here.</p>
        </div>
      </div>
  );

  return (
    <>
      <div className={containerClassName}>
        {isLoading && <ChartSkeleton loadingText={loadingText} />}
        {!isLoading && !imageUrl && <Placeholder />}
        {!isLoading && imageUrl && (
          <button
            onClick={handleOpenModal}
            className="relative group w-full h-full flex items-center justify-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-md"
            aria-label="Enlarge chart image"
          >
            <img
              src={imageUrl}
              alt="AI-generated chart"
              className="w-full h-full object-cover rounded-md transition-transform duration-300 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 rounded-md ring-1 ring-inset ring-cyan-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md">
                <ArrowsPointingOutIcon className="w-10 h-10 text-[--color-ghost-white] mb-2" />
                <p className="text-[--color-ghost-white] font-semibold">Click to enlarge</p>
            </div>
          </button>
        )}
      </div>

      {isModalOpen && (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-[fade-in_0.2s_ease-out]"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            onClick={handleCloseModal}
        >
          <div 
            className="relative w-[95vw] h-[95vh] flex items-center justify-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              ref={imageRef}
              src={imageUrl} 
              alt="Enlarged AI-generated chart" 
              className="max-w-none max-h-none rounded-lg shadow-2xl transition-transform duration-75 ease-out"
              style={{
                transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
                cursor: isPanning ? 'grabbing' : 'grab'
              }}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              draggable="false"
            />
          </div>
          <div className="absolute top-4 right-4 flex items-center space-x-2">
            <button
                onClick={resetTransform}
                className="text-[--color-ghost-white] bg-black/50 rounded-full p-2 hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white"
                aria-label="Reset zoom and pan"
            >
                <ArrowPathIcon className="w-6 h-6" />
            </button>
            <button
              onClick={handleCloseModal}
              className="text-[--color-ghost-white] bg-black/50 rounded-full p-2 hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Close image viewer"
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