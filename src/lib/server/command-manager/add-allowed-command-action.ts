'use server';

import prisma from '../db';

export async function addAllowedCommandAction(
  name: string,
  command: string,
  argCount: number,
) {
  await prisma.allowedCommand.create({
    data: {
      name,
      command,
      argCount,
    },
  });
}
