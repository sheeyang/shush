'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { usePingActions } from '@/stores/pingStore';
import { useState } from 'react';

export default function CommandInput() {
  const [address, setAddress] = useState('localhost');
  const { addCommandProcess } = usePingActions();

  const handleSubmit = async () => {
    try {
      await addCommandProcess('ping -n 10', [address], address);
    } catch (error) {
      console.error('Failed to add process:', error);
    }
  };

  return (
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
  );
}
