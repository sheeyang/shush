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
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useActionState, useState } from 'react';
import { Button } from '@/components/ui/button';
import { createUserAction } from '@/lib/server/auth/actions/create-user-action';

// Initial state for the form
const initialState = {
  success: false,
  message: '',
};

export default function AddUserCard() {
  const [pending, setPending] = useState(false);
  const [state, formAction] = useActionState(createUserAction, initialState);

  // Handle form submission
  const handleSubmit = async (formData: FormData) => {
    setPending(true);

    try {
      formAction(formData);

      if (state.success) {
        toast.success(state.message);
      } else if (state.message) {
        toast.error(state.message);
      }
    } catch (error) {
      toast.error('An unexpected error occurred: ' + String(error));
    } finally {
      setPending(false);
    }
  };

  return (
    <form action={handleSubmit}>
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
