'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';

import { removeAllowedCommandAction } from '@/lib/server/command-manager/remove-allowed-command-action';
import { addAllowedCommandAction } from '@/lib/server/command-manager/add-allowed-command-action';
import { useActions, useAllowedCommands } from '@/stores/process-store';
import { useEffect, useState } from 'react';

export default function ManageCommandsCard() {
  const [newCommand, setNewCommand] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const commands = useAllowedCommands();
  const processActions = useActions();

  useEffect(() => {
    processActions.fetchAllowedCommands();
  }, [processActions]);

  const handleAddCommand = async () => {
    if (!newCommand.trim()) {
      toast.error('Command cannot be empty');
      return;
    }

    setIsAdding(true);

    try {
      await addAllowedCommandAction(newCommand, newCommand, 0);

      toast.success('Command added successfully');
      setNewCommand('');
      processActions.fetchAllowedCommands();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(
          `Failed to add command: ${error.message || 'Unknown error'}`,
        );
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveCommand = async (command: string) => {
    try {
      await removeAllowedCommandAction(command);
      toast.success('Command removed successfully');
      processActions.fetchAllowedCommands(); // Refresh the list
    } catch (error) {
      if (error instanceof Error) {
        toast.error(
          `Failed to remove command: ${error.message || 'Unknown error'}`,
        );
      }
    }
  };

  return (
    <Card className='mt-6'>
      <CardHeader>
        <CardTitle>Manage Commands</CardTitle>
        <CardDescription>Add or remove allowed commands.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='mb-4 flex items-center gap-2'>
          <Input
            value={newCommand}
            onChange={(e) => setNewCommand(e.target.value)}
            placeholder='Enter command'
            className='flex-1'
          />
          <Button onClick={handleAddCommand} disabled={isAdding}>
            {isAdding ? <Loader2 size={16} className='animate-spin' /> : 'Add'}
          </Button>
        </div>

        {commands.map((cmd) => {
          return (
            <div
              key={cmd.id}
              className='flex items-center justify-between border-b py-2'
            >
              <div>
                <Label className='font-medium'>{cmd.name}</Label>
                <div className='text-sm text-gray-500'>{cmd.command}</div>
              </div>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => handleRemoveCommand(cmd.command)}
              >
                <Trash2 size={16} className='text-red-500' />
              </Button>
            </div>
          );
        })}
      </CardContent>
      <CardFooter>
        {/* You could add refresh button here */}
        <Button
          variant='outline'
          onClick={processActions.fetchAllowedCommands}
          className='w-full'
        >
          Refresh
        </Button>
      </CardFooter>
    </Card>
  );
}
