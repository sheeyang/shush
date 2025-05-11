import CommandCardList from '@/components/command/command-card-list';
import CommandInput from '@/components/command/command-input';
import { redirectUnauthenticated } from '@/lib/redirect-unauthenticated';

export default async function HomePage() {
  await redirectUnauthenticated();

  return (
    <div className='flex min-h-[calc(100vh-2rem)] w-full flex-col items-center gap-4 overflow-y-auto pt-[20vh] pb-8'>
      <CommandInput />
      <CommandCardList />
    </div>
  );
}
