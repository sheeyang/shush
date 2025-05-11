'use server';

import prisma from '../db';

export async function getAllowedCommandsAction() {
  const commands = await prisma.allowedCommand.findMany({
    select: {
      id: true,
      name: true,
      command: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return commands;
}
