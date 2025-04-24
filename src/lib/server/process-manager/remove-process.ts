import prisma from '../db';
import { killProcess } from './kill-process';

type RemoveProcessReturn = Promise<{
  success: boolean;
  message: string;
}>;

export async function removeProcess(processId: string): RemoveProcessReturn {
  try {
    await killProcess(processId);

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

    return {
      success: true,
      message: 'Process removed',
    };
  } catch (error) {
    console.error(`Error removing process ${processId}:`, error);
    return {
      success: false,
      message: `Failed to remove process: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
