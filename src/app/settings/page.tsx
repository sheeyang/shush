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
import { auth } from '@/lib/server/auth';
import AddUserButton from '@/components/settings/add-user-button';

export default function SettingsPage() {
  const signUpAction = async (formData: FormData) => {
    'use server';

    const username = formData.get('username')?.toString();
    const password = formData.get('password')?.toString();
    console.log(formData);

    if (!username || !password) {
      // TODO: proper error handling
      console.error('Missing username or password');
      return;
    }

    await auth.api.signUpEmail({
      body: {
        name: username,
        email: `${username}@email.email`,
        password: password,
      },
    });
  };

  return (
    <div className='container mx-auto py-10'>
      <h1 className='mb-6 text-3xl font-bold'>Settings</h1>
      <form action={signUpAction}>
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
              />
              <Label htmlFor='password'>Email</Label>
              <Input
                name='password'
                id='password'
                type='password'
                placeholder='Enter password'
              />
            </div>
          </CardContent>
          <CardFooter>
            <AddUserButton />
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
