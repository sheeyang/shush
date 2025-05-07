import 'server-only';

import { User } from '@/generated/prisma';
import prisma from '../db';
import { hashPassword } from './password';

export function verifyUsernameInput(username: string): boolean {
  return (
    username.length > 3 && username.length < 32 && username.trim() === username
  );
}

export async function createUser(
  username: string,
  password: string,
): Promise<Pick<User, 'id' | 'username'>> {
  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      username,
      passwordHash,
      role: 'user',
    },
  });

  return {
    id: user.id,
    username: user.username,
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

export async function updateUserUsername(
  userId: number,
  username: string,
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      username,
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

export async function getUserFromUsername(
  username: string,
): Promise<Pick<User, 'id' | 'username'> | null> {
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
  };
}

export async function checkUsernameAvailability(
  username: string,
): Promise<boolean> {
  const count = await prisma.user.count({
    where: {
      username: username,
    },
  });
  return count === 0;
}
