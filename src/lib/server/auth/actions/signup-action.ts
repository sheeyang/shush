// TODO: not in use

'use server';

import 'server-only';

import { verifyPasswordStrength } from '@/lib/server/auth/password';
import { RefillingTokenBucket } from '@/lib/server/auth/rate-limit';
import {
  createSession,
  generateSessionToken,
  setSessionTokenCookie,
} from '@/lib/server/auth/session';
import {
  checkUsernameAvailability,
  createUser,
  verifyUsernameInput,
} from '@/lib/server/auth/user';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { globalPOSTRateLimit } from '@/lib/server/auth/request';

const ipBucket = new RefillingTokenBucket<string>(3, 10);

export async function signupAction(
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
      message: 'Please enter your username and password',
    };
  }
  if (!verifyUsernameInput(username)) {
    return {
      message: 'Invalid username',
    };
  }
  const usernameAvailable = checkUsernameAvailability(username);
  if (!usernameAvailable) {
    return {
      message: 'Username is already used',
    };
  }
  if (!verifyUsernameInput(username)) {
    return {
      message: 'Invalid username',
    };
  }
  const strongPassword = await verifyPasswordStrength(password);
  if (!strongPassword) {
    return {
      message: 'Weak password',
    };
  }
  if (clientIP !== null && !ipBucket.consume(clientIP, 1)) {
    return {
      message: 'Too many requests',
    };
  }
  const user = await createUser(username, password);

  const sessionToken = generateSessionToken();
  const session = await createSession(sessionToken, user.id);
  await setSessionTokenCookie(sessionToken, session.expiresAt);
  return redirect('/2fa/setup');
}

interface ActionResult {
  message: string;
}
