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
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';

// You'll need to create these action files
import { getAllowedCommandsAction } from '@/lib/server/command-manager/get-allowed-commands-action';
import { removeAllowedCommandAction } from '@/lib/server/command-manager/remove-allowed-command-action';
import { addAllowedCommandAction } from '@/lib/server/command-manager/add-allowed-command-action';

// Define the command type based on your schema
type AllowedCommand = {
  id: number;
  name: string;
  command: string;
};

export default function ManageCommandsCard() {
  const [pending, setPending] = useState(false);
  const [commands, setCommands] = useState<AllowedCommand[]>([]);
  const [newCommand, setNewCommand] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const loadCommands = async () => {
    setPending(true);

    try {
      const commands = await getAllowedCommandsAction();

      setCommands(commands);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(
          `Failed to load commands: ${error.message || 'Unknown error'}`,
        );
      }
    } finally {
      setPending(false);
    }
  };

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
      loadCommands(); // Refresh the list
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
      loadCommands(); // Refresh the list
    } catch (error) {
      if (error instanceof Error) {
        toast.error(
          `Failed to remove command: ${error.message || 'Unknown error'}`,
        );
      }
    }
  };

  useEffect(() => {
    loadCommands();
  }, []);

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

        {pending ? (
          <div>Loading commands...</div>
        ) : (
          commands.map((cmd) => {
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
          })
        )}
        {!pending && commands.length === 0 && (
          <div className='py-4 text-center text-gray-500'>
            No commands found
          </div>
        )}
      </CardContent>
      <CardFooter>
        {/* You could add refresh button here */}
        <Button variant='outline' onClick={loadCommands} className='w-full'>
          Refresh
        </Button>
      </CardFooter>
    </Card>
  );
}
