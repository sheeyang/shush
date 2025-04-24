import { ProcessInfoClient } from '@/interfaces/process';
import prisma from '../db';

type GetAllProcessesReturn = Promise<
  | {
      success: true;
      processes: Record<string, ProcessInfoClient>;
    }
  | {
      success: false;
      message: string;
    }
>;

export async function getAllProcesses(): GetAllProcessesReturn {
  try {
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

    return { processes, success: true };
  } catch (error) {
    console.error('Error retrieving processes:', error);
    return { success: false, message: 'Failed to retrieve processes' };
  }
}
