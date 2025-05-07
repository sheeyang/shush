'use server';

import 'server-only';

import prisma from '../../db';
import { createUser } from '../user';

export async function createUserAction(_prev: unknown, formData: FormData) {
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
