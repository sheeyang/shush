import CommandCardList from '@/components/command/command-card-list';
import CommandInput from '@/components/command/command-input';
import { checkAuth } from '@/lib/check-auth';

export default async function PingPage() {
  await checkAuth();

  return (
    <div className='flex min-h-[calc(100vh-2rem)] w-full flex-col items-center gap-4 overflow-y-auto pt-[20vh] pb-8'>
      <CommandInput />
      <CommandCardList />
    </div>
  );
}
