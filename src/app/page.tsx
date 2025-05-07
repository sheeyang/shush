import { redirectUnauthenticated } from '@/lib/redirect-unauthenticated';
import { redirect } from 'next/navigation';

export default async function Home() {
  await redirectUnauthenticated();

  // Redirect to the ping page by default
  redirect('/ping');
}
