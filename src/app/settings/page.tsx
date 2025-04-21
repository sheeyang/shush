import AddUserCard from '@/components/settings/add-user-card';
import ManageUsersCard from '@/components/settings/manage-users-card';
import { auth } from '@/lib/server/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function SettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/sign-in');
  }

  return (
    <div className='container mx-auto py-10'>
      <h1 className='mb-6 text-3xl font-bold'>Settings</h1>
      <AddUserCard />
      <ManageUsersCard />
    </div>
  );
}
