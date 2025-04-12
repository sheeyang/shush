'use client';

import CommandCard from '@/components/command-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useProcesses } from '@/hooks/use-processes';
import { useState } from 'react';

export default function PingPage() {
  const [address, setAddress] = useState('localhost');
  const { processes, addProcess } = useProcesses();

  const handleSubmit = () => {
    addProcess('ping', [address], address);
  };

  return (
    <div className='flex min-h-[calc(100vh-2rem)] w-full flex-col items-center gap-2 overflow-y-auto pt-[20vh]'>
      <Card className='w-lg'>
        <CardContent className='flex flex-row gap-2'>
          <Input
            value={address}
            placeholder='Address'
            onChange={(e) => setAddress(e.target.value)}
          />
          <Button variant='outline' onClick={handleSubmit}>
            Add
          </Button>
        </CardContent>
      </Card>
      {processes.map(({ processId, label }, index) => (
        <CommandCard
          key={`${processId}-${index}`}
          processId={processId}
          label={label}
        />
      ))}
    </div>
  );
}
