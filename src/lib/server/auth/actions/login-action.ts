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

export async function loginAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  if (!globalPOSTRateLimit()) {
    return {
      message: 'Too many requests',
    };
  }
  // TODO: Assumes X-Forwarded-For is always included.
  const clientIP = (await headers()).get('X-Forwarded-For');
  if (clientIP !== null && !ipBucket.check(clientIP, 1)) {
    return {
      message: 'Too many requests',
    };
  }

  const username = formData.get('username');
  const password = formData.get('password');
  if (typeof username !== 'string' || typeof password !== 'string') {
    return {
      message: 'Invalid or missing fields',
    };
  }
  if (username === '' || password === '') {
    return {
      message: 'Please enter your username and password.',
    };
  }
  if (!verifyUsernameInput(username)) {
    return {
      message: 'Invalid username',
    };
  }
  const user = await getUserFromUsername(username);
  if (user === null) {
    return {
      message: 'Account does not exist',
    };
  }
  if (clientIP !== null && !ipBucket.consume(clientIP, 1)) {
    return {
      message: 'Too many requests',
    };
  }
  if (!throttler.consume(user.id)) {
    return {
      message: 'Too many requests',
    };
  }
  const passwordHash = await getUserPasswordHash(user.id);
  const validPassword = await verifyPasswordHash(passwordHash, password);
  if (!validPassword) {
    return {
      message: 'Invalid password',
    };
  }
  throttler.reset(user.id);
  const sessionToken = generateSessionToken();
  const session = await createSession(sessionToken, user.id);
  await setSessionTokenCookie(sessionToken, session.expiresAt);

  // Add a return statement here
  return {
    message: 'Login successful',
  };
}

interface ActionResult {
  message: string;
}
