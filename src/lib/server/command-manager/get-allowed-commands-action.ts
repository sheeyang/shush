'use server';

import { AllowedCommandInfo } from '@/interfaces/process';
import prisma from '../db';

export async function getAllowedCommandsAction(): Promise<
  AllowedCommandInfo[]
> {
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
