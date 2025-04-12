import { Label } from '@radix-ui/react-label';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import CommandOutput from './command-output';
import { useProcess } from '@/hooks/use-process';

export default function CommandCard({
  processId,
  label,
}: {
  processId: string;
  label: string;
}) {
  const { data, isStreaming, error, connectProcessStream, killProcess } =
    useProcess(processId);

  const handleSubmit = async () => {
    await connectProcessStream();
  };

  return (
    <Card className='w-lg'>
      <CardHeader className='flex items-center'>
        <Label className='w-full'>{label}</Label>
        {isStreaming && (
          <Button id='stop' variant='destructive' onClick={killProcess}>
            Stop
          </Button>
        )}
        {!isStreaming && (
          <Button id='start' variant='default' onClick={handleSubmit}>
            Start
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <CommandOutput output={data} error={error} />
      </CardContent>
      <CardFooter className='flex w-full flex-row gap-2'>
        <Label className='text-muted-foreground text-[10px]'>{processId}</Label>
      </CardFooter>
    </Card>
  );
}
