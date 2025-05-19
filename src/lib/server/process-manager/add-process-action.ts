'use server';

import 'server-only';

import prisma from '../db';
import { getCurrentSession } from '../auth/session';
import logger from '@/lib/logger';
import { getClientIp } from '../common/get-client-ip';

export async function addProcessAction(
  command: string,
  args: string[],
  label: string,
): Promise<string> {
  const { session } = await getCurrentSession();
  if (session === null) {
    throw new Error('Not authenticated');
  }

  const clientIp = await getClientIp();
  const processId = crypto.randomUUID();
  logger.info({
    type: 'addProcessAction',
    processId,
    command,
    args,
    label,
    clientIp,
  });

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
