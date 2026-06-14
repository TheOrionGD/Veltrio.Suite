import React, { useState, useRef, useEffect } from 'react';

interface FloatingWindowProps {
  title: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  headerTabs?: React.ReactNode;
  initialWidth?: number;
  initialHeight?: number;
}

const FloatingWindow: React.FC<FloatingWindowProps> = ({
  title,
  onClose,
  children,
  headerTabs,
  initialWidth = 800,
  initialHeight = 600,
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ w: initialWidth, h: initialHeight });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 767);

  // Center window on mount
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 767);
    window.addEventListener('resize', handleResize);
    
    // Initial centering for desktop
    if (window.innerWidth > 767) {
      setPosition({
        x: Math.max(0, (window.innerWidth - initialWidth) / 2),
        y: Math.max(0, (window.innerHeight - initialHeight) / 2),
      });
    }

    return () => window.removeEventListener('resize', handleResize);
  }, [initialWidth, initialHeight]);

  const dragStartRef = useRef({ x: 0, y: 0, startX: 0, startY: 0 });
  const resizeStartRef = useRef({ x: 0, y: 0, startW: 0, startH: 0 });

  const handlePointerDownDrag = (e: React.PointerEvent) => {
    if (isMobile) return;
    if ((e.target as HTMLElement).closest('button')) return;
    if ((e.target as HTMLElement).closest('.header-tabs')) return;
    
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startX: position.x,
      startY: position.y
    };
    
    const handlePointerMove = (ev: PointerEvent) => {
      const dx = ev.clientX - dragStartRef.current.x;
      const dy = ev.clientY - dragStartRef.current.y;
      setPosition({
        x: dragStartRef.current.startX + dx,
        y: Math.max(0, dragStartRef.current.startY + dy) // Prevent dragging above screen
      });
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handlePointerDownResize = (e: React.PointerEvent) => {
    if (isMobile) return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startW: size.w,
      startH: size.h
    };
    
    const handlePointerMove = (ev: PointerEvent) => {
      const dx = ev.clientX - resizeStartRef.current.x;
      const dy = ev.clientY - resizeStartRef.current.y;
      setSize({
        w: Math.max(320, resizeStartRef.current.startW + dx), // Min width
        h: Math.max(400, resizeStartRef.current.startH + dy)  // Min height
      });
    };

    const handlePointerUp = () => {
      setIsResizing(false);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const containerStyle = isMobile ? {} : {
    transform: `translate(${position.x}px, ${position.y}px)`,
    width: `${size.w}px`,
    height: `${size.h}px`,
    transition: isDragging || isResizing ? 'none' : 'transform 0.1s ease-out'
  };

  return (
    <div 
      className={`floating-window animate-in fade-in zoom-in-95 duration-300 ${isDragging || isResizing ? 'is-interacting' : ''}`}
      style={containerStyle}
    >
      <div 
        className={`p-4 md:p-5 border-b border-zinc-200/50 dark:border-white/5 flex items-center justify-between flex-shrink-0 ${!isMobile ? 'cursor-move select-none' : ''}`}
        onPointerDown={handlePointerDownDrag}
      >
        <h2 className="text-xs font-black uppercase tracking-widest text-[#234556] dark:text-[#effbfc] flex items-center gap-2">
          {title}
          {!isMobile && (
            <span className="text-[9px] text-zinc-500 normal-case tracking-normal ml-2 font-medium hidden md:inline-block">
              (Hold to drag)
            </span>
          )}
        </h2>
        
        {headerTabs && (
          <div className="header-tabs cursor-default">
            {headerTabs}
          </div>
        )}

        <button
          onClick={onClose}
          className="text-zinc-450 hover:text-red-500 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-zinc-800/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-xs font-black font-mono ml-4"
        >
          ✕
        </button>
      </div>

      <div className="flex-grow overflow-y-auto p-4 pb-36 md:p-5 md:pb-5 scrollbar-thin">
        {children}
      </div>

      {/* Resize Handle */}
      {!isMobile && (
        <div 
          className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize flex items-end justify-end p-2 z-50 opacity-50 hover:opacity-100 transition-opacity"
          onPointerDown={handlePointerDownResize}
        >
          <div className="w-2.5 h-2.5 border-r-[3px] border-b-[3px] border-accent rounded-br-[2px]" />
        </div>
      )}
    </div>
  );
};

export default FloatingWindow;
