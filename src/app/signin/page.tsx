'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { FormEvent, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { loginAction } from '@/lib/server/auth/actions/login-action';

const initialState = {
  message: '',
};

export default function SignIn() {
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    // Create a new FormData for login
    const loginFormData = new FormData();
    loginFormData.append('username', username);
    loginFormData.append('password', password);

    try {
      // Use the loginAction
      const result = await loginAction(initialState, loginFormData);

      if (result.message === 'Login successful') {
        router.push('/');
      } else {
        toast.error(`Failed to sign in: ${result.message}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`Failed to sign in: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='flex min-h-[calc(100vh-2rem)] w-full flex-col items-center justify-center overflow-y-auto py-8'>
      <Card className='w-lg'>
        <CardHeader>
          <CardTitle className='text-lg md:text-xl'>Sign In</CardTitle>
          <CardDescription className='text-xs md:text-sm'>
            Enter your username below to login to your account
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
                  placeholder='username'
                  required
                />
              </div>

              <div className='grid gap-2'>
                <div className='flex items-center'>
                  <Label htmlFor='password'>Password</Label>
                </div>

                <Input
                  id='password'
                  type='password'
                  name='password'
                  placeholder='password'
                  autoComplete='password'
                />
              </div>

              <div className='flex items-center gap-2'>
                <Checkbox
                  id='remember'
                  onClick={() => {
                    setRememberMe(!rememberMe);
                  }}
                />
                <Label htmlFor='remember'>Remember me</Label>
              </div>

              <Button type='submit' className='w-full' disabled={loading}>
                {loading ? (
                  <Loader2 size={16} className='animate-spin' />
                ) : (
                  'Login'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
