'use server';

import prisma from '../db';

export async function removeAllowedCommandAction(name: string) {
  await prisma.allowedCommand.delete({
    where: {
      name,
    },
  });
}
