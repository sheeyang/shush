import { ProcessState } from '@/generated/prisma';
import prisma from '../db';

type AddProcessReturn = Promise<
  | {
      success: true;
      processId: string;
      processState: ProcessState;
    }
  | {
      success: false;
      message: string;
    }
>;

export async function addProcess(
  command: string,
  args: string[],
  label: string,
): AddProcessReturn {
  try {
    const processId = crypto.randomUUID();

    // Store in database
    await prisma.processData.create({
      data: {
        id: processId,
        label,
        processState: 'initialized',
        command: command,
        args: JSON.stringify(args),
      },
    });

    return {
      success: true,
      processId,
      processState: 'initialized',
    };
  } catch (error) {
    console.error('Error adding process:', error);
    return { success: false, message: 'Failed to add process' };
  }
}
