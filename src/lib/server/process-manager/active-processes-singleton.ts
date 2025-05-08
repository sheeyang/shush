import 'server-only';

import { ProcessInfoServer } from '@/interfaces/process';

// Declare the global type
declare const globalThis: {
  activeProcessesGlobal: Map<string, ProcessInfoServer>;
} & typeof global;

const activeProcessesSingleton = () => {
  if (typeof globalThis.activeProcessesGlobal === 'undefined') {
    globalThis.activeProcessesGlobal = new Map<string, ProcessInfoServer>();
  }
  return globalThis.activeProcessesGlobal;
};

// Initialize the singleton instance
const activeProcessesInstance = activeProcessesSingleton();

export default activeProcessesInstance;
