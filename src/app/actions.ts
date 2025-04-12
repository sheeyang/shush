'use server';

import {
  addProcess,
  killProcess,
  runProcess,
} from '@/helpers/createCommandStream';

export async function killProcessAction(processId: string) {
  return killProcess(processId);
}

export async function createProcessAction(command: string, args: string[]) {
  return addProcess(command, args);
}

export async function runProcessAction(processId: string) {
  return runProcess(processId);
}
