'use client';

import { useActions, useProcessIds } from '@/stores/process-store';
import CommandCard from './command-card';
import { useEffect } from 'react';

export default function CommandCardList() {
  const processActions = useActions();

  useEffect(() => {
    processActions.fetchAllowedCommands();
    processActions.fetchAllProcesses();
  }, [processActions]);

  const processIds = useProcessIds();

  return processIds.map((processId) => (
    <CommandCard key={processId} processId={processId} />
  ));
}
