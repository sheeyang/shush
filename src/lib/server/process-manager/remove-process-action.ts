'use server';

import 'server-only';

import prisma from '../db';
import { killProcessAction } from './kill-process-action';
import { getCurrentSession } from '../auth/session';
import logger from '@/lib/logger';
import { getClientIp } from '../common/get-client-ip';

export async function removeProcessAction(processId: string): Promise<void> {
  const { session } = await getCurrentSession();
  if (session === null) {
    throw new Error('Not authenticated');
  }

  const clientIp = await getClientIp();
  logger.info({ type: 'removeProcessAction', processId, clientIp });

  try {
    await killProcessAction(processId);
  } catch (error) {
    if (error instanceof Error) {
      // ignore the error if the process is not found or not running
      if (
        error.message.includes('not found') ||
        error.message.includes('is not running')
      ) {
      } else throw error;
    }
  }

  // Use transaction to ensure atomic deletion
  await prisma.$transaction([
    // Delete associated output records
    prisma.processOutput.deleteMany({
      where: { processDataId: processId },
    }),
    // Delete the process data record
    prisma.processData.delete({
      where: { id: processId },
    }),
  ]);
}
