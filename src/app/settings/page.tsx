import AddUserCard from '@/components/settings/add-user-card';
import ManageUsersCard from '@/components/settings/manage-users-card';
import { redirectUnauthenticated } from '@/lib/redirect-unauthenticated';

export default async function SettingsPage() {
  await redirectUnauthenticated();

  return (
    <div className='container mx-auto py-10'>
      <h1 className='mb-6 text-3xl font-bold'>Settings</h1>
      <AddUserCard />
      <ManageUsersCard />
    </div>
  );
}
