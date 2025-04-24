'use server';

import { auth } from '@/lib/server/auth';
import prisma from '@/lib/server/db';

// THIS SHOULD ONLY BE USED FOR INITIAL SETUP
// IF THERE IS ALREADY AN ADMIN, IT WILL THROW AN ERROR
export async function createAdminAccount(username: string, password: string) {
  const existingAdmin = await prisma.user.findFirst({
    where: {
      role: 'admin',
    },
  });

  if (existingAdmin) {
    throw new Error('Admin account already exists');
  }

  await auth.api.createUser({
    body: {
      email: `${username}@email.email`,
      password,
      name: username,
      role: 'admin',
    },
  });
}
