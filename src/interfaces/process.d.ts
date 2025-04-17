import type { ChildProcess } from 'child_process';

export type ProcessState = 'initialized' | 'running' | 'terminated' | 'error';

type ProcessInfoServer =
  | {
      process: ChildProcess;
      processState: 'running';
    }
  | {
      process: null;
      processState: Exclude<ProcessState, 'running'>;
    };

type ProcessInfoClient = {
  label: string;

  processState: ProcessState;
  output: string;
};
