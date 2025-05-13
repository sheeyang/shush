'use client';

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
import { useEffect } from 'react';

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

  useEffect(() => {
    fetchAllowedCommands();
  }, [fetchAllowedCommands]);

  const allowedCommands = useAllowedCommands();

  const handleSubmit = async (formData: FormData) => {
    const arg = formData.get('arg')?.toString() ?? '';
    const command = formData.get('command')?.toString() ?? '';

    console.log({ arg, command });

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
          <Button variant='outline'>Add</Button>
        </CardContent>
      </Card>
    </form>
  );
}
