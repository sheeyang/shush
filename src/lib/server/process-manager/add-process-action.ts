'use server';

import 'server-only';

import prisma from '../db';
import { getCurrentSession } from '../auth/session';

export async function addProcessAction(
  command: string,
  args: string[],
  label: string,
): Promise<string> {
  const { session } = await getCurrentSession();
  if (session === null) {
    throw new Error('Not authenticated');
  }

  const processId = crypto.randomUUID();

  // Store in database
  await prisma.processData.create({
    data: {
      id: processId,
      label,
      processState: 'initialized',
      command: command,
      args: JSON.stringify(args),
    },
  });

  return processId;
}
