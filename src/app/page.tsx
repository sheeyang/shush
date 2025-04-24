import { checkAuth } from '@/lib/check-auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  await checkAuth();

  // Redirect to the ping page by default
  redirect('/ping');
}
