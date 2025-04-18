'use server';

import 'server-only';

import {
  addProcess,
  getAllProcesses,
  killProcess,
  removeProcess,
  runProcess,
} from '@/server/process-manager';

export async function addProcessAction(
  command: string,
  args: string[],
  label: string,
) {
  return addProcess(command, args, label);
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

export async function getAllProcessesAction() {
  return getAllProcesses();
}
