import type { ChildProcess } from 'child_process';
import { Readable } from 'stream';

export type ProcessState = 'initialized' | 'running' | 'terminated';

type ProcessInfoServer = {
  eventListeners?: ProcessEventListener;
  process: ChildProcess | null;
  eventStream: Readable;
};

type ProcessInfoClient = {
  label: string;
  processState: ProcessState;
  output: string;
  isConnectingStream: boolean;
  lastOutputTime: number;
};

type ProcessOutputInfoServer = {
  output: string;
  createdAt: Date;
};

type AllowedCommandInfo = {
  id: number;
  name: string;
  command: string;
};
