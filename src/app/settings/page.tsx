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
// Removed auth import as it's used in server action
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useActionState, useEffect } from 'react'; // Import useEffect
import { Button } from '@/components/ui/button';
import { addUserAction } from '@/actions/add-user-action';

// Define initial state and expected state structure for useFormState
const initialState = {
  message: '',
  error: false,
};

export default function SettingsPage() {
  const [state, formAction, pending] = useActionState(
    addUserAction,
    initialState,
  );

  // Use useEffect to show toast messages based on the state from the server action
  useEffect(() => {
    if (state.message) {
      if (state.error) {
        toast.error(state.message);
      } else {
        toast.success(state.message);
        // Optionally reset the form or redirect here
      }
    }
  }, [state]);

  return (
    <div className='container mx-auto py-10'>
      <h1 className='mb-6 text-3xl font-bold'>Settings</h1>
      {/* Pass formAction to the form's action prop */}
      <form action={formAction}>
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Add new users to the system.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid w-full items-center gap-4'>
              <Label htmlFor='username'>Username</Label>
              <Input
                name='username'
                id='username'
                placeholder='Enter username'
                required // Add required attribute for basic validation
              />
              {/* Label text corrected to Password */}
              <Label htmlFor='password'>Password</Label>
              <Input
                name='password'
                id='password'
                type='password'
                placeholder='Enter password'
                required // Add required attribute
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type='submit' className='w-full' disabled={pending}>
              {pending ? (
                <Loader2 size={16} className='animate-spin' />
              ) : (
                'Add User' // Updated button text
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
