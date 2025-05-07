import prisma from '../db';
import { hashPassword } from './password';

// TODO: should probably use this
// export function verifyUsernameInput(username: string): boolean {
//   return (
//     username.length > 3 && username.length < 32 && username.trim() === username
//   );
// }

export async function createUser(
  email: string,
  username: string,
  password: string,
): Promise<User> {
  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: 'user',
    },
  });

  return {
    id: user.id,
    email: user.email,
  };
}

export async function updateUserPassword(
  userId: number,
  password: string,
): Promise<void> {
  const passwordHash = await hashPassword(password);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}

export async function updateUserEmail(
  userId: number,
  email: string,
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      email,
    },
  });
}

export async function getUserPasswordHash(userId: number): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

  if (!user) {
    throw new Error('Invalid user ID');
  }

  return user.passwordHash;
}

export async function getUserFromEmail(email: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
  };
}

export interface User {
  id: number;
  email: string;
}
