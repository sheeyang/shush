'use server';

import 'server-only';

import { auth } from '@/lib/server/auth';
import { headers } from 'next/headers';

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
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return {
      success: false,
      message: 'Unauthorized',
    } as const;
  }

  return runProcess(processId);
}

export async function killProcessAction(processId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return {
      success: false,
      message: 'Unauthorized',
    } as const;
  }

  return killProcess(processId);
}

export async function removeProcessAction(processId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return {
      success: false,
      message: 'Unauthorized',
    } as const;
  }

  return removeProcess(processId);
}

export async function getAllProcessesAction() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return {
      success: false,
      message: 'Unauthorized',
    } as const;
  }

  return getAllProcesses();
}
