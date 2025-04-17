'use client';

import { Button } from './ui/button';
import { Label } from './ui/label';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import CommandOutput from './command-output';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  usePingActions,
  usePingProcessLabel,
  usePingProcessState,
} from '@/stores/pingStore';

export default function CommandCard({ processId }: { processId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const label = usePingProcessLabel(processId);
  const processState = usePingProcessState(processId);

  const { runProcess, killProcess, connectProcessStream, removeProcess } =
    usePingActions();

  useEffect(() => {
    connectProcessStream(processId);
  }, []);

  const handleSubmit = async () => {
    await runProcess(processId);
    await connectProcessStream(processId);
  };

  const handleRemove = () => {
    setIsDeleting(true);
    removeProcess(processId);
  };

  return (
    <Card className={`w-lg ${isDeleting && 'pointer-events-none opacity-50'}`}>
      <CardHeader className='flex items-center'>
        <Label className='w-full'>{label}</Label>
        {processState === 'running' && (
          <Button
            id='stop'
            variant='destructive'
            onClick={() => killProcess(processId)}
          >
            Stop
          </Button>
        )}
        {processState === 'initialized' && (
          <Button id='start' variant='default' onClick={handleSubmit}>
            Start
          </Button>
        )}

        <Button id='remove' variant='ghost' onClick={handleRemove}>
          <X />
        </Button>
      </CardHeader>
      <CardContent>
        <CommandOutput processId={processId} />
      </CardContent>
      <CardFooter className='flex w-full flex-row gap-2'>
        <Label className='text-muted-foreground text-[10px]'>{processId}</Label>
        <Label className='text-muted-foreground ml-auto text-[10px]'>
          {processState}
        </Label>
      </CardFooter>
    </Card>
  );
}
