import React, { useState, useRef } from 'react';

interface CompareSliderProps {
  original: string; 
  overlay: string;  
}

export const CompareSlider: React.FC<CompareSliderProps> = ({ original, overlay }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (event: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in event ? event.touches[0].clientX : (event as React.MouseEvent).clientX;
    
    // Calculate percentage
    const x = Math.max(0, Math.min(clientX - containerRect.left, containerRect.width));
    const percent = (x / containerRect.width) * 100;
    
    setSliderPosition(percent);
  };

  return (
    <div className="w-full max-w-md mx-auto rounded-xl overflow-hidden shadow-lg border border-gray-200 my-4">
      <div className="bg-blue-50 p-2 text-center text-xs text-blue-600 font-bold uppercase tracking-wide select-none">
        ↔ Drag to Compare (Original vs AI)
      </div>
      
      <div 
        ref={containerRef}
        className="relative h-[300px] bg-black cursor-ew-resize select-none touch-none"
        onMouseDown={() => setIsDragging(true)}
        onTouchStart={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onTouchEnd={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onMouseMove={handleMove}
        onTouchMove={handleMove}
      >
        {/* Background (Right Side - AI Mask) */}
        <img 
          src={overlay} 
          alt="AI Mask" 
          className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none"
        />

        {/* Foreground (Left Side - Original) - Clipped */}
        <div 
          className="absolute top-0 left-0 h-full overflow-hidden pointer-events-none border-r-2 border-white shadow-xl"
          style={{ width: `${sliderPosition}%` }}
        >
          <img 
            src={original} 
            alt="Original" 
            className="absolute top-0 left-0 h-full max-w-none object-cover"
            style={{ width: containerRef.current?.offsetWidth || '100%' }}
          />
        </div>

        {/* Slider Handle */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-blue-500 cursor-ew-resize shadow-md"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-blue-500">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
              <path d="m9 18 6-6-6-6"/>
              <path d="m15 18 6-6-6-6"/>
              <path d="m21 18 6-6-6-6"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
