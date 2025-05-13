'use client';

import { createProcessStore } from './creators/create-process-store';

export const {
  useAllowedCommands,
  useProcessIds,
  useProcessState,
  useProcessOutput,
  useProcessLabel,
  useActions,
} = createProcessStore();
