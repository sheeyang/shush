'use server';

import 'server-only';

import { ProcessInfoClient } from '@/interfaces/process';
import prisma from '../db';
import { getCurrentSession } from '../auth/session';
import { getClientIp } from '../common/get-client-ip';
import logger from '@/lib/logger';

export async function getAllProcessesAction(): Promise<
  Record<string, ProcessInfoClient>
> {
  const { session } = await getCurrentSession();
  if (session === null) {
    throw new Error('Not authenticated');
  }

  const clientIp = await getClientIp();
  logger.info({ type: 'getAllProcessesAction', clientIp });

  const databaseProcesses = await prisma.processData.findMany({
    select: {
      id: true,
      label: true,
      processState: true,
      output: {
        orderBy: {
          createdAt: 'asc', // make sure the output is in the correct order
        },
      },
    },
  });

  const processes = databaseProcesses.reduce(
    (acc, processData) => {
      const outputs = processData.output;
      const lastOutput =
        outputs.length > 0 ? outputs[outputs.length - 1] : null;

      acc[processData.id] = {
        label: processData.label,
        output: outputs.map((output) => output.data).join(''),
        processState: processData.processState,
        isConnectingStream: false,
        lastOutputTime: lastOutput ? lastOutput.createdAt.getTime() : 0,
      };
      return acc;
    },
    {} as Record<string, ProcessInfoClient>,
  );

  return processes;
}
