'use server';

import 'server-only';

import activeProcesses from './active-processes-singleton';
import { getCurrentSession } from '../auth/session';

export async function killProcessAction(processId: string): Promise<void> {
  const { session } = await getCurrentSession();
  if (session === null) {
    throw new Error('Not authenticated');
  }

  const processInfo = activeProcesses.get(processId);

  if (!processInfo) {
    throw new Error(`Process ${processId} not found`);
  }

  if (!processInfo?.process) {
    throw new Error(`Process ${processId} is not running`);
  }

  processInfo.process.kill();
}
