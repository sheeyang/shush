import type { ChildProcess } from 'child_process';
import { Readable } from 'stream';

export type ProcessState = 'initialized' | 'running' | 'terminated';

// type ProcessEventListener = {
//   onStdout: (data: Buffer) => Promise<void>;
//   onStderr: (data: Buffer) => Promise<void>;
//   onClose: (code: number) => Promise<void>;
//   onError: (err: Error) => Promise<void>;
// };

type ProcessInfoServer = {
  eventListeners?: ProcessEventListener;
  process: ChildProcess | null;
  outputStream: Readable;
};

type ProcessInfoClient = {
  label: string;
  processState: ProcessState;
  output: string;
  isConnectingStream: boolean;
};

type ProcessOutputInfo = {
  processId: string;
  output: string;
  lastOutputTime: number;
  firstOutputTime: number;
};

// type StreamEventListeners = {
//   onStdout: (data: Buffer) => void;
//   onStderr: (data: Buffer) => void;
//   onClose: (code: number) => void;
//   onError: (err: Error) => void;
// };
