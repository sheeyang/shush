'use client';

import CommandCard from '@/components/command-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useAddCommandProcess, useProcesses } from '../../stores/pingStore';

export default function PingPage() {
  const [address, setAddress] = useState('localhost');
  const processes = useProcesses();
  const addProcess = useAddCommandProcess();

  const handleSubmit = async () => {
    try {
      await addProcess('ping', [address], address);
    } catch (error) {
      console.error('Failed to add process:', error);
    }
  };

  return (
    <div className='flex min-h-[calc(100vh-2rem)] w-full flex-col items-center gap-4 overflow-y-auto pt-[20vh] pb-8'>
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
      {processes.map(({ processId, label }) => (
        <CommandCard key={processId} processId={processId} label={label} />
      ))}
    </div>
  );
}
