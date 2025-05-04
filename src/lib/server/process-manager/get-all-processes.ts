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
