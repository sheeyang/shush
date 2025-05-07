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

import prisma from '@/lib/server/db';

type ActionResult = {
  success: boolean;
  message: string;
};

const ipBucket = new RefillingTokenBucket<string>(3, 10);

// THIS SHOULD ONLY BE USED FOR INITIAL SETUP BECAUSE THERE CAN ONLY BE ONE ADMIN
export async function createAdminAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  if (!globalPOSTRateLimit()) {
    return {
      success: false,
      message: 'Too many requests',
    };
  }

  const existingAdmin = await prisma.user.findFirst({
    where: {
      role: 'admin',
    },
  });

  if (existingAdmin) {
    return {
      success: false,
      message: 'Admin already exists',
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
      message: 'Please enter your username and password',
    };
  }
  if (!verifyUsernameInput(username)) {
    return {
      success: false,
      message: 'Invalid username',
    };
  }
  const usernameAvailable = checkUsernameAvailability(username);
  if (!usernameAvailable) {
    return {
      success: false,
      message: 'Username is already used',
    };
  }
  const strongPassword = await verifyPasswordStrength(password);
  if (!strongPassword) {
    return {
      success: false,
      message: 'Weak password',
    };
  }
  if (clientIP !== null && !ipBucket.consume(clientIP, 1)) {
    return {
      success: false,
      message: 'Too many requests',
    };
  }
  const user = await createUser(username, password, 'admin');

  const sessionToken = generateSessionToken();
  const session = await createSession(sessionToken, user.id);
  await setSessionTokenCookie(sessionToken, session.expiresAt);
  return redirect('/');
}
