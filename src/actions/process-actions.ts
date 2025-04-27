'use server';

import 'server-only';

import { auth } from '@/lib/server/auth';
import { headers } from 'next/headers';
import { addProcess } from '@/lib/server/process-manager/add-process';
import { runProcess } from '@/lib/server/process-manager/run-process';
import { killProcess } from '@/lib/server/process-manager/kill-process';
import { removeProcess } from '@/lib/server/process-manager/remove-process';
import { getAllProcesses } from '@/lib/server/process-manager/get-all-processes';

export async function addProcessAction(
  command: string,
  args: string[],
  label: string,
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error('Unauthorized');
  }

  return addProcess(command, args, label);
}

export async function runProcessAction(processId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error('Unauthorized');
  }

  return runProcess(processId);
}

export async function killProcessAction(processId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error('Unauthorized');
  }

  return killProcess(processId);
}

export async function removeProcessAction(processId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error('Unauthorized');
  }

  return removeProcess(processId);
}

export async function getAllProcessesAction() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error('Unauthorized');
  }

  return getAllProcesses();
}
