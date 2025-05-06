import prisma from './db';

export function verifyEmailInput(email: string): boolean {
  return /^.+@.+\..+$/.test(email) && email.length < 256;
}

export async function checkEmailAvailability(email: string): Promise<boolean> {
  const count = await prisma.user.count({
    where: {
      email: email,
    },
  });
  return count === 0;
}
