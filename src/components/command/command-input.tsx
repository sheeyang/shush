'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useActions, useAllowedCommands } from '@/stores/process-store';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CommandInputProps {
  inputValue?: string;
  inputDisabled?: boolean;
  onSubmit?: (formData: FormData) => void;
}

export default function CommandInput({
  inputValue = '',
  onSubmit = () => {},
}: CommandInputProps) {
  const { addCommandProcess, fetchAllowedCommands } = useActions();
  const allowedCommands = useAllowedCommands();
  const commandRef = useRef<string>('');

  useEffect(() => {
    fetchAllowedCommands();
  }, [fetchAllowedCommands]);

  const handleCommandChange = (value: string) => {
    commandRef.current = value;
  };

  const handleSubmit = async (formData: FormData) => {
    // Bug with formData, after first submit it will secretly go
    // back to the first value without updating the UI, so we are using
    // a ref to store the value
    // const command = formData.get('command')?.toString() || '';
    const command = commandRef.current;
    const arg = formData.get('arg')?.toString() || '';

    try {
      await addCommandProcess(command, [arg], arg);
    } catch (error) {
      console.error('Failed to add process:', error);
    }

    onSubmit(formData);
  };

  return (
    <form action={handleSubmit}>
      <Card className='w-lg'>
        <CardContent className='flex flex-row gap-2'>
          <Select
            key={allowedCommands.length > 0 ? 'loaded' : 'loading'} // force re-render when allowedCommands changes
            name='command'
            onValueChange={handleCommandChange}
            defaultValue={allowedCommands[0]?.command || ''}
          >
            <SelectTrigger className='w-60'>
              <SelectValue placeholder='Command' />
            </SelectTrigger>
            <SelectContent>
              {allowedCommands.map((commandDetails) => (
                <SelectItem
                  value={commandDetails.command}
                  key={commandDetails.id}
                >
                  {commandDetails.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input name='arg' defaultValue={inputValue} />
          <Button type='submit' variant='outline'>
            Add
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
