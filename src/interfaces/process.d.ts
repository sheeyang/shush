import type { ChildProcess } from 'child_process';

export type ProcessState = 'initialized' | 'running' | 'terminated';

type ProcessInfoServer = {
  process: ChildProcess | null;
  output: string;

  command: string;
  args: string[];
  createdAt: number;
  processState: ProcessState;
};

type ProcessInfoClient = {
  label: string;

  processState: ProcessState;
  output: string;
  //   createdAt: number;
};
