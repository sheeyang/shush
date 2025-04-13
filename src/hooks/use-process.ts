import { killProcessAction, runProcessAction } from '@/app/actions';
import { useState, useCallback } from 'react';

export function useProcess(processId: string) {
  // const [data, setData] = useState('');
  // const [processState, setProcessState] = useState('initialized'); // TODO: intial state should be 'terminated'
  // const [error, setError] = useState<string | null>(null);
  // const runProcess = useCallback(async () => {
  //   const { success, message, processState } =
  //     await runProcessAction(processId);
  //   if (!success) {
  //     setError(message);
  //   }
  //   setProcessState(processState);
  // }, [processId]);
  // const killProcess = useCallback(async () => {
  //   const { success, message, processState } =
  //     await killProcessAction(processId);
  //   if (!success) {
  //     setError(message);
  //   }
  //   setProcessState(processState);
  // }, [processId]);
  // const connectProcessStream = useCallback(async () => {
  //   setData('');
  //   setError(null);
  //   try {
  //     const response = await fetch(`/api/connect/${processId}`);
  //     if (!response.ok) {
  //       const errorText = await response.text();
  //       throw new Error(errorText || 'Failed to connect to process');
  //     }
  //     if (!response.body) {
  //       throw new Error('Response body is null');
  //     }
  //     const reader = response.body.getReader();
  //     const decoder = new TextDecoder();
  //     while (true) {
  //       const { done, value } = await reader.read();
  //       if (done) {
  //         break;
  //       }
  //       const chunk = decoder.decode(value, { stream: true });
  //       setData((prev) => prev + chunk);
  //     }
  //   } catch (error) {
  //     setError(
  //       error instanceof Error ? error.message : 'An unknown error occurred',
  //     );
  //   } finally {
  //     setProcessState('terminated');
  //   }
  // }, [processId]);
  // return {
  //   data,
  //   processState,
  //   error,
  //   runProcess,
  //   killProcess,
  //   connectProcessStream,
  // };
}
