'use server';

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

const passwordUpdateBucket = new ExpiringTokenBucket<string>(5, 60 * 30);

export async function updatePasswordAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  if (!globalPOSTRateLimit()) {
    return {
      message: 'Too many requests',
    };
  }
  const { session, user } = await getCurrentSession();
  if (session === null) {
    return {
      message: 'Not authenticated',
    };
  }

  if (!passwordUpdateBucket.check(session.id, 1)) {
    return {
      message: 'Too many requests',
    };
  }

  const password = formData.get('password');
  const newPassword = formData.get('new_password');
  if (typeof password !== 'string' || typeof newPassword !== 'string') {
    return {
      message: 'Invalid or missing fields',
    };
  }
  const strongPassword = await verifyPasswordStrength(newPassword);
  if (!strongPassword) {
    return {
      message: 'Weak password',
    };
  }
  if (!passwordUpdateBucket.consume(session.id, 1)) {
    return {
      message: 'Too many requests',
    };
  }
  const passwordHash = await getUserPasswordHash(user.id);
  const validPassword = await verifyPasswordHash(passwordHash, password);
  if (!validPassword) {
    return {
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
    message: 'Updated password',
  };
}

interface ActionResult {
  message: string;
}
