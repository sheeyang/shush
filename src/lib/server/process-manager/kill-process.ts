import { ProcessState } from '@/generated/prisma';
import activeProcesses from '../processes';
import spawn from 'cross-spawn';
import { cleanupProcess } from './helpers/cleanup-process';
import { updateDatabase } from './helpers/update-database';

type KillProcessReturn = Promise<
  | {
      success: true;
      processState: ProcessState;
    }
  | {
      success: false;
      processState: ProcessState;
      message: string;
    }
>;

export async function killProcess(processId: string): KillProcessReturn {
  try {
    const processInfo = activeProcesses.get(processId);

    if (!processInfo) {
      return {
        success: false,
        message: 'Process not found',
        processState: 'error',
      };
    }

    if (!processInfo?.process) {
      return {
        success: false,
        message: `Process ${processId} is not running`,
        processState: 'error',
      };
    }

    try {
      // Kill the process using appropriate method
      if (processInfo.process.pid) {
        spawn('taskkill', [
          '/pid',
          processInfo.process.pid.toString(),
          '/f',
          '/t',
        ]);
      } else {
        processInfo.process.kill();
      }
    } catch (error) {
      console.error('Error killing process:', error);
      return {
        success: false,
        message: `Error killing process: ${error instanceof Error ? error.message : 'Unknown error'}`,
        processState: 'error',
      };
    }

    await cleanupProcess(processId, processInfo);
    await updateDatabase(processId, { state: 'terminated' });

    return {
      success: true,
      processState: 'terminated',
    };
  } catch (error) {
    console.error(`Error killing process ${processId}:`, error);
    return {
      success: false,
      message: `General error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      processState: 'error',
    };
  }
}
