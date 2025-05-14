'use client';

import React from 'react';
import ResizableScrollArea from '../common/resizable-scroll-area';
import { useProcessOutput } from '@/stores/process-store';

export default function CommandOutput({ processId }: { processId: string }) {
  const output = useProcessOutput(processId);
  return (
    <ResizableScrollArea className='w-full rounded-md border p-4'>
      <pre className='text-xs whitespace-pre-wrap'>{output}</pre>
    </ResizableScrollArea>
  );
}
