'use server';

import 'server-only';

import { getCurrentSession } from '@/lib/server/auth/session';

import { globalPOSTRateLimit } from '@/lib/server/auth/request';
import {
  checkUsernameAvailability,
  updateUserUsername,
  verifyUsernameInput,
} from '../user';
import { checkRole } from '../helpers';

type ActionResult = {
  success: boolean;
  message: string;
};

export async function updateUsernameAction(
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

  const username = formData.get('username');
  if (typeof username !== 'string') {
    return {
      success: false,
      message: 'Invalid or missing fields',
    };
  }
  if (username === '') {
    return {
      success: false,
      message: 'Please enter your username',
    };
  }
  if (!verifyUsernameInput(username)) {
    return {
      success: false,
      message: 'Please enter a valid username',
    };
  }
  const usernameAvailable = await checkUsernameAvailability(username);
  if (!usernameAvailable) {
    return {
      success: false,
      message: 'This username is already used',
    };
  }

  await updateUserUsername(user.id, username);

  return {
    success: true,
    message: 'Username updated successfully',
  };
}
