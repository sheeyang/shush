'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormEvent, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { createAdminAccount } from '@/actions/create-admin-account';
import { authClient } from '@/lib/auth-client';

export default function Setup() {
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    try {
      if (!username || !password) {
        throw new Error('Username and password are required.');
      }

      await createAdminAccount(username, password);

      // Automatically sign in
      await authClient.signIn.email({
        email: `${username}@email.email`,
        password,
      });

      toast.success(`User ${username} created successfully!`);
      router.push('/');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(
          `Failed to create user: ${error.message || 'Unknown error'}`,
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='flex min-h-[calc(100vh-2rem)] w-full flex-col items-center justify-center overflow-y-auto py-8'>
      <Card className='w-lg'>
        <CardHeader>
          <CardTitle className='text-lg md:text-xl'>Admin account</CardTitle>
          <CardDescription className='text-xs md:text-sm'>
            Create an admin account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className='grid gap-4'>
              <div className='grid gap-2'>
                <Label htmlFor='username'>Username</Label>
                <Input
                  id='username'
                  type='username'
                  name='username'
                  autoComplete='username'
                  placeholder='Username'
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='password'>Password</Label>
                <Input
                  id='password'
                  type='password'
                  name='password'
                  autoComplete='new-password'
                  placeholder='Password'
                />
              </div>

              <Button type='submit' className='w-full' disabled={loading}>
                {loading ? (
                  <Loader2 size={16} className='animate-spin' />
                ) : (
                  'Create account'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <div className='flex w-full justify-center border-t py-4'>
            <p className='text-center text-xs text-neutral-500'>
              {/* Secured by <span className='text-orange-400'>better-auth.</span> */}
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
