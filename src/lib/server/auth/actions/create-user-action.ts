'use server';

import 'server-only';

import { verifyPasswordStrength } from '@/lib/server/auth/password';
import { RefillingTokenBucket } from '@/lib/server/auth/rate-limit';
import {
  checkUsernameAvailability,
  createUser,
  verifyUsernameInput,
} from '@/lib/server/auth/user';
import { headers } from 'next/headers';
import { globalPOSTRateLimit } from '@/lib/server/auth/request';
import { getCurrentSession } from '../session';
import { checkRole } from '../helpers';

type ActionResult = {
  success: boolean;
  message: string;
};

const ipBucket = new RefillingTokenBucket<string>(3, 10);

export async function createUserAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
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

  if (!(await checkRole(session, 'admin'))) {
    return {
      success: false,
      message: 'Not authorized',
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
  await createUser(username, password);

  return {
    success: true,
    message: `User ${username} created successfully!`,
  };
}
