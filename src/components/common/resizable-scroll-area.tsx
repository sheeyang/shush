'use client';

import * as React from 'react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { cn } from '@/lib/utils'; // Assuming this is your classnames utility
import { ScrollArea } from '../ui/scroll-area'; // Assuming this is your ScrollArea component

interface ResizableScrollAreaProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  initialHeight?: number;
  minHeight?: number;
  maxHeight?: number;
  handleClassName?: string;
  scrollAreaProps?: Omit<
    React.ComponentProps<typeof ScrollAreaPrimitive.Root>,
    'children' | 'className' | 'style'
  >;
}

export default function ResizableScrollArea({
  children,
  className,
  initialHeight = 200, // Default initial height
  minHeight = 100, // Default min height
  maxHeight = 600, // Default max height
  handleClassName,
  scrollAreaProps, // Pass additional props to the inner ScrollArea
  ...props // Pass rest of the props to the main wrapper div
}: ResizableScrollAreaProps) {
  const [height, setHeight] = React.useState(initialHeight);
  const [isResizing, setIsResizing] = React.useState(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const startYRef = React.useRef(0);
  const startHeightRef = React.useRef(0);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!wrapperRef.current) return;
    setIsResizing(true);
    startYRef.current = e.clientY;
    startHeightRef.current = wrapperRef.current.offsetHeight;
    // Prevent text selection during drag
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId); // Capture the pointer

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  };

  const handlePointerMove = React.useCallback(
    (e: PointerEvent) => {
      const currentY = e.clientY;
      const deltaY = currentY - startYRef.current;
      let newHeight = startHeightRef.current + deltaY;

      // Apply constraints
      newHeight = Math.max(minHeight, newHeight);
      newHeight = Math.min(maxHeight, newHeight);

      setHeight(newHeight);
    },
    [minHeight, maxHeight],
  );

  const handlePointerUp = React.useCallback(
    (e: PointerEvent) => {
      setIsResizing(false);
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      // Release pointer capture
      const target = e.target as HTMLElement;
      if (target.releasePointerCapture) {
        target.releasePointerCapture(e.pointerId);
      }
    },
    [handlePointerMove],
  );

  // Cleanup listeners if component unmounts while resizing
  React.useEffect(() => {
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  return (
    <div
      ref={wrapperRef}
      className={cn(
        'border-input relative overflow-hidden rounded-md border',
        className,
      )}
      style={{ height: `${height}px` }}
      {...props}
    >
      {/* The original ScrollArea now fills the wrapper */}
      <ScrollArea
        className='h-full' // Make ScrollArea fill the wrapper height
        {...scrollAreaProps} // Pass through other ScrollArea specific props
      >
        {children}
      </ScrollArea>

      {/* Resize Handle */}
      <div
        data-slot='resize-handle'
        onPointerDown={handlePointerDown}
        className={cn(
          'bg-muted hover:bg-muted-foreground/20 absolute bottom-0 left-0 h-2 w-full cursor-ns-resize touch-none transition-colors', // Style the handle, add touch-none
          isResizing && 'bg-muted-foreground/30',
          handleClassName,
        )}
        style={{ zIndex: 10 }} // Ensure handle is above scrollbar corner if they overlap
      />
    </div>
  );
}
