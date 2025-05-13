'use client';

import { useSearchParams } from 'next/navigation';

export default function SharePage() {
  const searchParams = useSearchParams();
  const sharedText = searchParams.get('text');

  console.log(searchParams.entries());

  return (
    <div className='p-4'>
      <h1 className='mb-4 text-xl font-bold'>Content Shared</h1>
      <div>
        <p>Content was shared to the app!</p>
        <div>
          <p>
            <strong>Shared content:</strong> {sharedText}
          </p>
        </div>
      </div>
    </div>
  );
}
