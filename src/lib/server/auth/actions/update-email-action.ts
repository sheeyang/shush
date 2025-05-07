'use server';

import { getCurrentSession } from '@/lib/server/auth/session';
import {
  checkEmailAvailability,
  verifyEmailInput,
} from '@/lib/server/auth/email';
import { globalPOSTRateLimit } from '@/lib/server/auth/request';
import { updateUserEmail } from '../user';

export async function updateEmailAction(
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

  const email = formData.get('email');
  if (typeof email !== 'string') {
    return { message: 'Invalid or missing fields' };
  }
  if (email === '') {
    return {
      message: 'Please enter your email',
    };
  }
  if (!verifyEmailInput(email)) {
    return {
      message: 'Please enter a valid email',
    };
  }
  const emailAvailable = await checkEmailAvailability(email);
  if (!emailAvailable) {
    return {
      message: 'This email is already used',
    };
  }

  await updateUserEmail(user.id, email);

  return {
    message: 'Email updated successfully',
  };
}

interface ActionResult {
  message: string;
}
