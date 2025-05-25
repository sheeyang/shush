'use server';

import 'server-only';

import { globalPOSTRateLimit } from '@/lib/server/auth/request';
import {
  deleteSessionTokenCookie,
  getCurrentSession,
  invalidateSession,
} from '@/lib/server/auth/session';
import { redirect } from 'next/navigation';

type ActionResult = {
  success: boolean;
  message: string;
};

export async function logoutAction(): Promise<ActionResult> {
  if (!globalPOSTRateLimit()) {
    return {
      success: false,
      message: 'Too many requests',
    };
  }
  const { session } = await getCurrentSession();
  if (session === null) {
    return {
      success: false,
      message: 'Not authenticated',
    };
  }
  await invalidateSession(session.id);
  await deleteSessionTokenCookie();
  redirect('/login');
}
