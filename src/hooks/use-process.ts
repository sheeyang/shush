import { useState, useCallback } from 'react';

export function useProcess(processId: string) {
  const [data, setData] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectProcessStream = useCallback(async () => {
    setData('');
    setIsRunning(true);
    setError(null);

    try {
      const response = await fetch(`/api/connect/${processId}`);

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        setData((prev) => prev + chunk);
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'An unknown error occurred',
      );
    } finally {
      setIsRunning(false);
    }
  }, []);

  const killProcess = useCallback(async () => {
    if (processId) {
      try {
        const response = await fetch(`/api/kill/${processId}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message);
        }

        setIsRunning(false);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : 'Failed to terminate process',
        );
      }
    }
  }, []);

  return {
    data,
    isStreaming: isRunning,
    error,
    connectProcessStream,
    killProcess,
  };
}
