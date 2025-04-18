import 'server-only';

import { ProcessInfoServer } from '@/interfaces/process';

const activeProcessesSingleton = () => {
  return new Map<string, ProcessInfoServer>();
};

declare const globalThis: {
  activeProcessesGlobal: ReturnType<typeof activeProcessesSingleton>;
} & typeof global;

const activeProcesses =
  globalThis.activeProcessesGlobal ?? activeProcessesSingleton();

export default activeProcesses;

if (process.env.NODE_ENV !== 'production')
  globalThis.activeProcessesGlobal = activeProcesses;
