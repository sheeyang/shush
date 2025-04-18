'use client';

import React from 'react';
import { ResizableScrollArea } from './ui/scroll-area';
import { usePingProcessOutput } from '@/stores/ping-store';

export default function CommandOutput({ processId }: { processId: string }) {
  const output = usePingProcessOutput(processId);
  return (
    <ResizableScrollArea className='w-full rounded-md border p-4'>
      <pre className='text-xs whitespace-pre-wrap'>{output}</pre>
    </ResizableScrollArea>
  );
}
