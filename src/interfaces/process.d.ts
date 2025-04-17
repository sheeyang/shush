import type { ChildProcess } from 'child_process';

export type ProcessState = 'initialized' | 'running' | 'terminated' | 'error';

type ProcessInfoServer = {
  process: ChildProcess | null;
};

type ProcessInfoClient = {
  label: string;
  processState: ProcessState;
  output: string;
  isConnectingStream: boolean;
};
