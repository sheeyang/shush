import { useState, useCallback } from 'react';

export type StreamFetchResult = {
    data: string;
    isStreaming: boolean;
    error: string | null;
    processId: string | null;
    fetchStream: (url: string) => Promise<void>;
    killStream: () => Promise<void>;
};

export function useStreamFetch(): StreamFetchResult {
    const [data, setData] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [processId, setProcessId] = useState<string | null>(null);

    const fetchStream = useCallback(async (url: string) => {
        setData('');
        setIsStreaming(true);
        setError(null);
        setProcessId(null);

        try {
            const response = await fetch(url);

            // Get the process ID from headers
            const currentProcessId = response.headers.get('X-Process-ID');
            if (currentProcessId) {
                setProcessId(currentProcessId);
            }

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
                setData(prev => prev + chunk);
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'An unknown error occurred');
        } finally {
            setIsStreaming(false);
        }
    }, []);

    const killStream = useCallback(async () => {
        if (processId) {
            try {
                const response = await fetch(`/api/kill/${processId}`);
                const result = await response.json();

                if (!result.success) {
                    throw new Error(result.message);
                }

                setIsStreaming(false);
            } catch (error) {
                setError(error instanceof Error ? error.message : 'Failed to terminate process');
            }
        }
    }, [processId]);

    return {
        data,
        isStreaming,
        error,
        processId,
        fetchStream,
        killStream
    };
}