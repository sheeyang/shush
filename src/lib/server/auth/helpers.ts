import 'server-only';

import prisma from '../db';
import { Session } from '@/generated/prisma';

export async function checkRole(session: Session, role: string) {
  const user = await prisma.user.findUnique({
    where: {
      id: session.userId,
    },
  });

  return user?.role === role;
}
