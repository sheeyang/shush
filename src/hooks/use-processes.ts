import { createProcessAction } from '@/app/actions';
import { useCallback, useState } from 'react';

type ProcessInfo = {
  processId: string;
  label: string;
};

export function useProcesses() {
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);

  const addProcess = useCallback(
    async (command: string, args: string[], label: string) => {
      const { success, message, processId } = await createProcessAction(
        command,
        args,
      );

      if (!success) {
        throw new Error(message);
      }

      setProcesses([...processes, { processId, label }]);

      console.log(processes);
    },
    [processes],
  );

  return {
    processes,
    addProcess,
  };
}
