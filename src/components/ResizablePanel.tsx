import React, { useState, useRef, useEffect, ReactNode } from 'react';

interface ResizablePanelProps {
  children: ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
  resizable?: 'left' | 'right' | 'both' | 'none';
  storageKey?: string; // Clé pour sauvegarder la taille dans localStorage
}

const ResizablePanel: React.FC<ResizablePanelProps> = ({
  children,
  defaultWidth = 320,
  minWidth = 200,
  maxWidth = 600,
  className = '',
  resizable = 'right',
  storageKey
}) => {
  // Initialiser la largeur depuis localStorage si disponible
  const [width, setWidth] = useState(() => {
    if (storageKey) {
      const savedWidth = localStorage.getItem(storageKey);
      if (savedWidth) {
        const parsedWidth = parseInt(savedWidth, 10);
        return Math.min(Math.max(parsedWidth, minWidth), maxWidth);
      }
    }
    return defaultWidth;
  });
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const isResizingRef = useRef(false);
  const currentDirectionRef = useRef<'left' | 'right'>('right');

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizingRef.current) return;
    
    const deltaX = e.clientX - startXRef.current;
    const newWidth = currentDirectionRef.current === 'right' 
      ? startWidthRef.current + deltaX 
      : startWidthRef.current - deltaX;
    
    const clampedWidth = Math.min(Math.max(newWidth, minWidth), maxWidth);
    setWidth(clampedWidth);
    
    // Sauvegarder dans localStorage si une clé est fournie
    if (storageKey) {
      localStorage.setItem(storageKey, clampedWidth.toString());
    }
  };

  const handleMouseUp = () => {
    isResizingRef.current = false;
    setIsResizing(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  const handleMouseDown = (e: React.MouseEvent, direction: 'left' | 'right') => {
    e.preventDefault();
    e.stopPropagation();
    
    isResizingRef.current = true;
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
    currentDirectionRef.current = direction;
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, []);

  return (
    <div 
      ref={panelRef}
      className={`relative flex-shrink-0 ${className}`}
      style={{ width: `${width}px` }}
    >
      {children}
      
      {/* Séparateur de redimensionnement à droite */}
      {(resizable === 'right' || resizable === 'both') && (
        <div
          className={`absolute top-0 -right-1 w-3 h-full cursor-col-resize group transition-all duration-200 z-10 ${
            isResizing ? 'bg-blue-500/20' : 'bg-transparent hover:bg-blue-400/20'
          }`}
          onMouseDown={(e) => handleMouseDown(e, 'right')}
          title="Glisser pour redimensionner"
        >
          {/* Indicateur visuel */}
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-8 bg-gray-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
            isResizing ? 'opacity-100 bg-blue-500' : ''
          }`} />
        </div>
      )}
      
      {/* Séparateur de redimensionnement à gauche */}
      {(resizable === 'left' || resizable === 'both') && (
        <div
          className={`absolute top-0 -left-1 w-3 h-full cursor-col-resize group transition-all duration-200 z-10 ${
            isResizing ? 'bg-blue-500/20' : 'bg-transparent hover:bg-blue-400/20'
          }`}
          onMouseDown={(e) => handleMouseDown(e, 'left')}
          title="Glisser pour redimensionner"
        >
          {/* Indicateur visuel */}
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-8 bg-gray-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
            isResizing ? 'opacity-100 bg-blue-500' : ''
          }`} />
        </div>
      )}
    </div>
  );
};

export default ResizablePanel;