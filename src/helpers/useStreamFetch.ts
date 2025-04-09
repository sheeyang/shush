import { useState, useCallback } from 'react';

interface StreamFetchState {
    data: string;
    isLoading: boolean;
    isStreaming: boolean;
    error: string | null;
}

export function useStreamFetch() {
    const [state, setState] = useState<StreamFetchState>({
        data: '',
        isLoading: false,
        isStreaming: false,
        error: null
    });

    const fetchStream = useCallback(async (url: string) => {
        setState({
            data: '',
            isLoading: true,
            isStreaming: true,
            error: null
        });

        try {
            const response = await fetch(url);

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
                setState(prev => ({
                    ...prev,
                    data: prev.data + chunk
                }));
            }
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'An unknown error occurred'
            }));
        } finally {
            setState(prev => ({
                ...prev,
                isLoading: false,
                isStreaming: false
            }));
        }
    }, []);

    return {
        ...state,
        fetchStream
    };
}