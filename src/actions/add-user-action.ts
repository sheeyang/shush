'use server';

import 'server-only';

import { auth } from '@/lib/server/auth';

interface FormState {
  message: string;
  error: boolean;
}

export async function addUserAction(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const username = formData.get('username')?.toString();
  const password = formData.get('password')?.toString();

  if (!username || !password) {
    return { message: 'Missing username or password.', error: true };
  }

  try {
    // Use the server-side auth API
    await auth.api.signUpEmail({
      body: {
        name: username,
        email: `${username}@example.com`, //TODO
        password: password,
      },
    });
    // Return success state
    return {
      message: `User "${username}" created successfully!`,
      error: false,
    };
  } catch (error) {
    console.error('Sign up error:', error);

    if (error instanceof Error) {
      let errorMessage = 'Failed to create user.';
      if (error.message) {
        // You might want to parse specific error codes/messages from your auth provider
        errorMessage = error.message;
      }
      return { message: errorMessage, error: true };
    }
    return { message: 'An unknown error occurred.', error: true };
  }
}
