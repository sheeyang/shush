'use server';

import { getCurrentSession } from '@/lib/server/auth/session';

import { globalPOSTRateLimit } from '@/lib/server/auth/request';
import {
  checkUsernameAvailability,
  updateUserUsername,
  verifyUsernameInput,
} from '../user';

export async function updateUsernameAction(
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

  const username = formData.get('username');
  if (typeof username !== 'string') {
    return { message: 'Invalid or missing fields' };
  }
  if (username === '') {
    return {
      message: 'Please enter your username',
    };
  }
  if (!verifyUsernameInput(username)) {
    return {
      message: 'Please enter a valid username',
    };
  }
  const usernameAvailable = await checkUsernameAvailability(username);
  if (!usernameAvailable) {
    return {
      message: 'This username is already used',
    };
  }

  await updateUserUsername(user.id, username);

  return {
    message: 'Username updated successfully',
  };
}

interface ActionResult {
  message: string;
}
