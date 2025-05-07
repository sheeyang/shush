'use client';

import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { fetchUsersAction } from '@/lib/server/auth/actions/fetch-users-action';

export default function ManageUsersCard() {
  const [pending, setPending] = useState(false);
  const [users, setUsers] = useState<
    {
      id: number;
      email: string;
      role: string;
    }[]
  >([]);

  const loadUsers = async () => {
    setPending(true);

    try {
      const response = await fetchUsersAction();

      if ('error' in response) {
        throw new Error(response.error);
      }

      setUsers(response.users);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(
          `Failed to load users: ${error.message || 'Unknown error'}`,
        );
      }
    } finally {
      setPending(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage users</CardTitle>
        <CardDescription>Modify or delete users.</CardDescription>
      </CardHeader>
      <CardContent>
        {pending ? (
          <div>Loading users...</div>
        ) : (
          users.map((user) => {
            return (
              <div key={user.id} className='border-b py-2'>
                <Label className='font-medium'>{user.email}</Label>
                <div className='text-sm text-gray-500'>
                  {user.email} • {user.role || 'user'}
                </div>
              </div>
            );
          })
        )}
        {!pending && users.length === 0 && (
          <div className='py-4 text-center text-gray-500'>No users found</div>
        )}
      </CardContent>
      <CardFooter>
        {/* You could add refresh button or pagination controls here */}
      </CardFooter>
    </Card>
  );
}
