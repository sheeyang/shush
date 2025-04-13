import { Button } from './ui/button';
import { Label } from './ui/label';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import CommandOutput from './command-output';
import { useProcess } from '@/hooks/use-process';
import { usePingActions } from '@/stores/pingStore';
import { X } from 'lucide-react';
import { useState } from 'react';

export default function CommandCard({
  processId,
  label,
}: {
  processId: string;
  label: string;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const {
    data,
    processState,
    error,
    runProcess,
    killProcess,
    connectProcessStream,
  } = useProcess(processId);

  const handleSubmit = async () => {
    await runProcess();
    await connectProcessStream();
  };

  const { removeProcess } = usePingActions();

  const handleRemove = () => {
    setIsDeleting(true);
    removeProcess(processId);
  };

  return (
    <Card className={`w-lg ${isDeleting && 'pointer-events-none opacity-50'}`}>
      <CardHeader className='flex items-center'>
        <Label className='w-full'>{label}</Label>
        {processState === 'running' && (
          <Button id='stop' variant='destructive' onClick={killProcess}>
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
        <CommandOutput output={data} error={error} />
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
