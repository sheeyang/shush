'use server';

import { globalPOSTRateLimit } from '@/lib/server/request';
import {
  deleteSessionTokenCookie,
  getCurrentSession,
  invalidateSession,
} from '@/lib/server/session';
import { redirect } from 'next/navigation';

export async function logoutAction(): Promise<ActionResult> {
  if (!globalPOSTRateLimit()) {
    return {
      message: 'Too many requests',
    };
  }
  const { session } = await getCurrentSession();
  if (session === null) {
    return {
      message: 'Not authenticated',
    };
  }
  await invalidateSession(session.id);
  await deleteSessionTokenCookie();
  return redirect('/login');
}

interface ActionResult {
  message: string;
}
