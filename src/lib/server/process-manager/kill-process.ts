import 'server-only';

import activeProcesses from '../processes';

export async function killProcess(processId: string): Promise<void> {
  const processInfo = activeProcesses.get(processId);

  if (!processInfo) {
    throw new Error(`Process ${processId} not found`);
  }

  if (!processInfo?.process) {
    throw new Error(`Process ${processId} is not running`);
  }

  processInfo.process.kill();
}
