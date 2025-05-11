'use client';

import { createProcessStore } from './creators/create-process-store';

export const {
  useProcessIds,
  useProcessState,
  useProcessOutput,
  useProcessLabel,
  useActions,
} = createProcessStore();
