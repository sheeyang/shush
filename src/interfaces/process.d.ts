import type { ChildProcessWithoutNullStreams } from 'child_process';

export type ProcessState = 'initialized' | 'running' | 'terminated';

type ProcessInfoServer = {
  process: ChildProcessWithoutNullStreams | null;
  output: string;

  command: string;
  args: string[];
  createdAt: number;
  processState: ProcessState;
};

type ProcessInfoClient = {
  label: string;

  processState: ProcessState;
  data: string;
  //   createdAt: number;
};
