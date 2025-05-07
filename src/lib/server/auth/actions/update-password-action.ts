'use server';

import 'server-only';

import {
  verifyPasswordHash,
  verifyPasswordStrength,
} from '@/lib/server/auth/password';
import { ExpiringTokenBucket } from '@/lib/server/auth/rate-limit';
import {
  createSession,
  generateSessionToken,
  getCurrentSession,
  invalidateUserSessions,
  setSessionTokenCookie,
} from '@/lib/server/auth/session';
import {
  getUserPasswordHash,
  updateUserPassword,
} from '@/lib/server/auth/user';
import { globalPOSTRateLimit } from '@/lib/server/auth/request';
import { checkRole } from '../helpers';

const passwordUpdateBucket = new ExpiringTokenBucket<string>(5, 60 * 30);

type ActionResult = {
  success: boolean;
  message: string;
};

export async function updatePasswordAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  if (!globalPOSTRateLimit()) {
    return {
      success: false,
      message: 'Too many requests',
    };
  }
  const { session, user } = await getCurrentSession();
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

  if (!passwordUpdateBucket.check(session.id, 1)) {
    return {
      success: false,
      message: 'Too many requests',
    };
  }

  const password = formData.get('password');
  const newPassword = formData.get('new_password');
  if (typeof password !== 'string' || typeof newPassword !== 'string') {
    return {
      success: false,
      message: 'Invalid or missing fields',
    };
  }
  const strongPassword = await verifyPasswordStrength(newPassword);
  if (!strongPassword) {
    return {
      success: false,
      message: 'Weak password',
    };
  }
  if (!passwordUpdateBucket.consume(session.id, 1)) {
    return {
      success: false,
      message: 'Too many requests',
    };
  }
  const passwordHash = await getUserPasswordHash(user.id);
  const validPassword = await verifyPasswordHash(passwordHash, password);
  if (!validPassword) {
    return {
      success: false,
      message: 'Incorrect password',
    };
  }
  passwordUpdateBucket.reset(session.id);
  invalidateUserSessions(user.id);
  await updateUserPassword(user.id, newPassword);

  const sessionToken = generateSessionToken();

  const newSession = await createSession(sessionToken, user.id);
  setSessionTokenCookie(sessionToken, newSession.expiresAt);
  return {
    success: true,
    message: 'Updated password',
  };
}
