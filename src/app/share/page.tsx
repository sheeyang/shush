'use client';

import { redirect, useSearchParams } from 'next/navigation';
import CommandInput from '@/components/command/command-input';

export default function SharePage() {
  const searchParams = useSearchParams();
  const sharedText = searchParams.get('text') || '';

  return (
    <div className='flex min-h-[calc(100vh-2rem)] w-full flex-col items-center justify-center overflow-y-auto py-8'>
      <CommandInput
        inputValue={sharedText}
        onSubmit={() => {
          redirect('/');
        }}
      />
    </div>
  );
}
