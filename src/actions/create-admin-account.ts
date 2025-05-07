'use server';

import prisma from '@/lib/server/db';
import { createUser } from '@/lib/server/auth/user';

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

  const email = `${username}@email.email`;

  // Create the user with our custom function
  const user = await createUser(email, username, password);

  // Update the user role to admin
  await prisma.user.update({
    where: { id: user.id },
    data: { role: 'admin' },
  });

  return user;
}
