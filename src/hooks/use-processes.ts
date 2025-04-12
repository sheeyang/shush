import { useState } from "react";

type ProcessInfo = {
    processId: string;
    label: string; 
}

export function useProcesses() {
    const [processes, setProcesses] = useState<ProcessInfo[]>([])

    const addProcess = async (url: string, label: string) => {

        const processId = (await fetch(url)).headers.get('X-Process-ID') || 'failed' ; // TODO: add error handling

        setProcesses([...processes, {processId,  label}]);
    }

    return {
        processes,
        addProcess
    }
}