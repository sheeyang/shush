'use server';

import prisma from '@/lib/server/db';

export async function fetchUsersAction() {
  try {
    const users = await prisma.user.findMany({
      take: 10,
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    return { users };
  } catch (error) {
    return { error: (error as Error).message };
  }
}
