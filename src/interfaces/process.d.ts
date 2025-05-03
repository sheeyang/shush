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
};

type ProcessOutputEvent = {
  event: 'output';
  processId: string;
  output: string;
};

type ProcessStateEvent = {
  event: 'state';
  processId: string;
  state: ProcessState;
};

type ProcessEvent = ProcessOutputEvent | ProcessStateEvent;
