import { Button } from './ui/button';
import { Label } from './ui/label';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import CommandOutput from './command-output';
import { X } from 'lucide-react';
import { useState } from 'react';
import { usePingActions, usePingProcess } from '@/stores/pingStore';

export default function CommandCard({ processId }: { processId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);

  // Use the specific process selector instead of all processes
  const process = usePingProcess(processId);
  const { processState, output, label } = process;
  const { runProcess, killProcess, connectProcessStream, removeProcess } =
    usePingActions();

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

        <Button id='start' variant='ghost' onClick={handleRemove}>
          <X />
        </Button>
      </CardHeader>
      <CardContent>
        <CommandOutput output={output} error={null} />
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
