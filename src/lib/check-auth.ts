import { redirect } from 'next/navigation';
import prisma from './server/db';
import { getCurrentSession } from './server/session';

export async function checkAuth() {
  const { session } = await getCurrentSession();

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
