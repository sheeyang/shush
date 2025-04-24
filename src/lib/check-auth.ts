import { headers } from 'next/headers';
import { auth } from './server/auth';
import { redirect } from 'next/navigation';
import prisma from './server/db';

export async function checkAuth() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    const existingAdmin = await prisma.user.findFirst({
      where: {
        role: 'admin',
      },
    });

    if (existingAdmin) redirect('/signin');
    else redirect('/setup');
  }
}
