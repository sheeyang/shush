'use server';

import 'server-only';

import activeProcesses from './active-processes-singleton';
import { getCurrentSession } from '../auth/session';
import logger from '@/lib/logger';
import { getClientIp } from '../common/get-client-ip';

export async function killProcessAction(processId: string): Promise<void> {
  const { session } = await getCurrentSession();
  if (session === null) {
    throw new Error('Not authenticated');
  }

  const clientIp = await getClientIp();
  logger.info({ type: 'killProcessAction', processId, clientIp });

  const processInfo = activeProcesses.get(processId);

  if (!processInfo) {
    throw new Error(`Process ${processId} not found`);
  }

  if (!processInfo?.process) {
    throw new Error(`Process ${processId} is not running`);
  }

  processInfo.process.kill();
}
