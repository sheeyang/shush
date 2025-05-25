'use server';

import 'server-only';

import { verifyPasswordHash } from '@/lib/server/auth/password';
import { RefillingTokenBucket, Throttler } from '@/lib/server/auth/rate-limit';
import {
  createSession,
  generateSessionToken,
  setSessionTokenCookie,
} from '@/lib/server/auth/session';
import {
  getUserFromUsername,
  getUserPasswordHash,
  verifyUsernameInput,
} from '@/lib/server/auth/user';
import { headers } from 'next/headers';
import { globalPOSTRateLimit } from '@/lib/server/auth/request';

const throttler = new Throttler<number>([1, 2, 4, 8, 16, 30, 60, 180, 300]);
const ipBucket = new RefillingTokenBucket<string>(20, 1);

type ActionResult = {
  success: boolean;
  message: string;
};

export async function loginAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  if (!globalPOSTRateLimit()) {
    return {
      success: false,
      message: 'Too many requests',
    };
  }
  // TODO: Assumes X-Forwarded-For is always included.
  const clientIP = (await headers()).get('X-Forwarded-For');
  if (clientIP !== null && !ipBucket.check(clientIP, 1)) {
    return {
      success: false,
      message: 'Too many requests',
    };
  }

  const username = formData.get('username');
  const password = formData.get('password');
  if (typeof username !== 'string' || typeof password !== 'string') {
    return {
      success: false,
      message: 'Invalid or missing fields',
    };
  }
  if (username === '' || password === '') {
    return {
      success: false,
      message: 'Please enter your username and password.',
    };
  }
  if (!verifyUsernameInput(username)) {
    return {
      success: false,
      message: 'Invalid username',
    };
  }
  const user = await getUserFromUsername(username);
  if (user === null) {
    return {
      success: false,
      message: 'Account does not exist',
    };
  }
  if (clientIP !== null && !ipBucket.consume(clientIP, 1)) {
    return {
      success: false,
      message: 'Too many requests',
    };
  }
  if (!throttler.consume(user.id)) {
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
      message: 'Invalid password',
    };
  }
  throttler.reset(user.id);
  const sessionToken = generateSessionToken();
  const session = await createSession(sessionToken, user.id);
  await setSessionTokenCookie(sessionToken, session.expiresAt);

  return {
    success: true,
    message: 'Login successful',
  };
}
