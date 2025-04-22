import type { ChildProcess } from 'child_process';

export type ProcessState = 'initialized' | 'running' | 'terminated' | 'error';

type ProcessEventListener = {
  onStdout: (data: Buffer) => Promise<void>;
  onStderr: (data: Buffer) => Promise<void>;
  onClose: (code: number) => Promise<void>;
  onError: (err: Error) => Promise<void>;
};

type ProcessInfoServer = {
  eventListeners?: ProcessEventListener;
  process: ChildProcess | null;
};

type ProcessInfoClient = {
  label: string;
  processState: ProcessState;
  output: string;
  isConnectingStream: boolean;
};
