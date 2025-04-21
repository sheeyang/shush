'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { authClient } from '@/lib/auth-client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/button';

export default function AddUserCard() {
  const [pending, setPending] = useState(false);

  const handleAddUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    if (!username || !password) {
      toast.error('Username and password are required.');
      setPending(false);
      return;
    }

    try {
      const response = await authClient.admin.createUser({
        email: username,
        name: `${username}@email.email`,
        password: password,
        role: 'user',
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast.success(`User ${username} created successfully!`);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(
          `Failed to create user: ${error.message || 'Unknown error'}`,
        );
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleAddUser}>
      <Card>
        <CardHeader>
          <CardTitle>Add User</CardTitle>
          <CardDescription>Add new users to the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid w-full items-center gap-4'>
            <Label htmlFor='username'>Username</Label>
            <Input
              name='username'
              id='username'
              placeholder='Enter username'
              required
            />
            <Label htmlFor='password'>Password</Label>
            <Input
              name='password'
              id='password'
              type='password'
              placeholder='Enter password'
              required
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type='submit' className='w-full' disabled={pending}>
            {pending ? (
              <Loader2 size={16} className='animate-spin' />
            ) : (
              'Add User'
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
