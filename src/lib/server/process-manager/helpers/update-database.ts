import { ProcessState } from '@/generated/prisma';
import prisma from '../../db';

export async function updateDatabase(
  processId: string,
  {
    appendOutput = null,
    state = null,
  }: { appendOutput?: string | null; state?: ProcessState | null } = {},
) {
  try {
    if (appendOutput !== null) {
      await prisma.processOutput.create({
        data: {
          data: appendOutput,
          processDataId: processId,
        },
      });
    }

    if (state !== null) {
      await prisma.processData.update({
        where: { id: processId },
        data: {
          processState: state,
        },
      });
    }

    return true;
  } catch (error) {
    console.error(`Error updating database for process ${processId}:`, error);
    return false;
  }
}
