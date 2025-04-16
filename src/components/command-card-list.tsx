'use client';

import { usePingProcessIds } from '@/stores/pingStore';
import CommandCard from './command-card';

export default function CommandCardList() {
  const processIds = usePingProcessIds();

  return processIds.map((processId) => (
    <CommandCard key={processId} processId={processId} />
  ));
}
