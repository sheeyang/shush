import React from 'react';
import { ResizableScrollArea } from './ui/scroll-area';

interface CommandOutputProps {
  output: string;
  error: string | null;
}

export default function CommandOutput({ output, error }: CommandOutputProps) {
  return (
    <ResizableScrollArea className='w-full rounded-md border p-4'>
      <pre className='text-xs whitespace-pre-wrap'>
        {output}
        {error}
      </pre>
    </ResizableScrollArea>
  );
}
