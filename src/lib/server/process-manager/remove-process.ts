import 'server-only';

import prisma from '../db';
import { killProcess } from './kill-process';

export async function removeProcess(processId: string): Promise<void> {
  try {
    await killProcess(processId);
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
