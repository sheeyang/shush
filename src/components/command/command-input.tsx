'use client';

import { useEffect, useState } from 'react';
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
  const [command, setCommand] = useState('');

  useEffect(() => {
    fetchAllowedCommands();
  }, [fetchAllowedCommands]);

  // Set the initial command to the first allowed command if not already set
  useEffect(() => {
    if (allowedCommands.length > 0 && !command) {
      setCommand(allowedCommands[0].command);
    }
  }, [allowedCommands, command]);

  const handleSubmit = async (formData: FormData) => {
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
          <Select name='command' onValueChange={setCommand} value={command}>
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
