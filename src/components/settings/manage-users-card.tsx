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
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { UserWithRole } from 'better-auth/plugins/admin';

export default function AddUserCard() {
  const [pending, setPending] = useState(false);
  const [users, setUsers] = useState<UserWithRole[]>([]);

  const loadUsers = async () => {
    setPending(true);

    try {
      const response = await authClient.admin.listUsers({
        query: {
          limit: 10,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setUsers(response.data.users);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(
          `Failed to create user: ${error.message || 'Unknown error'}`,
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
        {!pending &&
          users.map((user) => {
            return (
              <div key={user.id}>
                <Label>{user.name}</Label>
              </div>
            );
          })}
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  );
}
