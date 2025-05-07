'use server';

import 'server-only';

import prisma from '@/lib/server/db';
import { getCurrentSession } from '../session';
import { checkRole } from '../helpers';
import { User } from '@/generated/prisma';

type ActionResult =
  | {
      success: false;
      message: string;
    }
  | {
      success: true;
      users: Pick<User, 'id' | 'role' | 'username'>[];
    };

export async function fetchUsersAction(): Promise<ActionResult> {
  const { session } = await getCurrentSession();
  if (session === null) {
    return {
      success: false,
      message: 'Not authenticated',
    };
  }

  if (!(await checkRole(session, 'admin'))) {
    return {
      success: false,
      message: 'Not authorized',
    };
  }

  try {
    const users = await prisma.user.findMany({
      take: 10,
      select: {
        id: true,
        username: true,
        role: true,
      },
    });

    return { success: true, users };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}
