'use server';

import 'server-only';

import {
  addProcess,
  killProcess,
  removeProcess,
  runProcess,
} from '@/helpers/createCommandStream';

export async function createProcessAction(command: string, args: string[]) {
  return addProcess(command, args);
}

export async function runProcessAction(processId: string) {
  return runProcess(processId);
}

export async function killProcessAction(processId: string) {
  return killProcess(processId);
}

export async function removeProcessAction(processId: string) {
  return removeProcess(processId);
}
