'use client';

import * as React from 'react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';

import { cn } from '@/lib/utils';

function ScrollArea({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root>) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot='scroll-area'
      className={cn('relative', className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot='scroll-area-viewport'
        className='focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1'
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

function ScrollBar({
  className,
  orientation = 'vertical',
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot='scroll-area-scrollbar'
      orientation={orientation}
      className={cn(
        'flex touch-none p-px transition-colors select-none',
        orientation === 'vertical' &&
          'h-full w-2.5 border-l border-l-transparent',
        orientation === 'horizontal' &&
          'h-2.5 flex-col border-t border-t-transparent',
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot='scroll-area-thumb'
        className='bg-border relative flex-1 rounded-full'
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  );
}

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

function ResizableScrollArea({
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

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!wrapperRef.current) return;
    setIsResizing(true);
    startYRef.current = e.clientY;
    startHeightRef.current = wrapperRef.current.offsetHeight;
    // Prevent text selection during drag
    e.preventDefault();

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = React.useCallback(
    (e: MouseEvent) => {
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

  const handleMouseUp = React.useCallback(() => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  // Cleanup listeners if component unmounts while resizing
  React.useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

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
        onMouseDown={handleMouseDown}
        className={cn(
          'bg-muted hover:bg-muted-foreground/20 absolute bottom-0 left-0 h-2 w-full cursor-ns-resize transition-colors', // Style the handle
          isResizing && 'bg-muted-foreground/30',
          handleClassName,
        )}
        style={{ zIndex: 10 }} // Ensure handle is above scrollbar corner if they overlap
      />
    </div>
  );
}

export { ScrollArea, ScrollBar, ResizableScrollArea };
