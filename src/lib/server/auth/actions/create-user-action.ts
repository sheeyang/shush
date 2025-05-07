'use server';

import 'server-only';

import prisma from '../../db';
import { createUser } from '../user';
import { getCurrentSession } from '../session';
import { checkRole } from '../helpers';

type ActionResult = {
  success: boolean;
  message: string;
};

export async function createUserAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
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

  const username = formData.get('username');
  const password = formData.get('password');

  if (
    typeof username !== 'string' ||
    typeof password !== 'string' ||
    !username ||
    !password
  ) {
    return {
      success: false,
      message: 'Username and password are required.',
    };
  }

  try {
    // Create the user with our custom function
    const user = await createUser(username, password);

    // Update the user role to 'user'
    await prisma.user.update({
      where: { id: user.id },
      data: { role: 'user' },
    });

    return {
      success: true,
      message: `User ${username} created successfully!`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
