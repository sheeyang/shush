import CommandCardList from '@/components/command-card-list';
import CommandInput from '@/components/command-input';

export default function PingPage() {
  return (
    <div className='flex min-h-[calc(100vh-2rem)] w-full flex-col items-center gap-4 overflow-y-auto pt-[20vh] pb-8'>
      <CommandInput />
      <CommandCardList />
    </div>
  );
}
