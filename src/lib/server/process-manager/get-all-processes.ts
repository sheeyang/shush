import { ProcessInfoClient } from '@/interfaces/process';
import prisma from '../db';

export async function getAllProcesses(): Promise<
  Record<string, ProcessInfoClient>
> {
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
      acc[processData.id] = {
        label: processData.label,
        output: processData.output.map((output) => output.data).join(''),
        processState: processData.processState,
        isConnectingStream: false,
      };
      return acc;
    },
    {} as Record<string, ProcessInfoClient>,
  );

  return processes;
}
