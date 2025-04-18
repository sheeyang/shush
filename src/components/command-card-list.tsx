'use client';

import { usePingActions, usePingProcessIds } from '@/stores/ping-store';
import CommandCard from './command-card';
import { useEffect } from 'react';

export default function CommandCardList() {
  const processActions = usePingActions();

  useEffect(() => {
    processActions.initializeStore();
  }, [processActions]);

  const processIds = usePingProcessIds();

  return processIds.map((processId) => (
    <CommandCard key={processId} processId={processId} />
  ));
}
