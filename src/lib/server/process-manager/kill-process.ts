import activeProcesses from '../processes';
import spawn from 'cross-spawn';
import { cleanupProcess } from './helpers/cleanup-process';
import { updateDatabase } from './helpers/update-database';

export async function killProcess(processId: string): Promise<void> {
  const processInfo = activeProcesses.get(processId);

  if (!processInfo) {
    throw new Error(`Process ${processId} not found`);
  }

  if (!processInfo?.process) {
    throw new Error(`Process ${processId} is not running`);
  }

  // Kill the process using appropriate method
  if (processInfo.process.pid) {
    spawn('taskkill', ['/pid', processInfo.process.pid.toString(), '/f', '/t']);
  } else {
    processInfo.process.kill();
  }

  await cleanupProcess(processId);
  await updateDatabase(processId, { state: 'terminated' });
}
