import { auth } from '@/lib/server/auth';
import { headers } from 'next/headers';
import CommandCardList from '@/components/command-card-list';
import CommandInput from '@/components/command-input';
import { redirect } from 'next/navigation';

export default async function PingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/sign-in');
  }

  return (
    <div className='flex min-h-[calc(100vh-2rem)] w-full flex-col items-center gap-4 overflow-y-auto pt-[20vh] pb-8'>
      <CommandInput />
      <CommandCardList />
    </div>
  );
}
