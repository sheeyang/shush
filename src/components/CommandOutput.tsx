import React from 'react';

interface CommandOutputProps {
    output: string;
    error: string | null;
    maxHeight?: string;
}

export default function CommandOutput({ output, error, maxHeight = "200px" }: CommandOutputProps) {
    return (
        <div className={`mt-4 p-4 border rounded-md bg-gray-50 dark:bg-gray-800 w-full max-w-md overflow-auto max-h-[${maxHeight}]`}>
            <pre className="text-sm whitespace-pre-wrap">
                {
                    error
                        ? `Error: ${error}`
                        : (output || "")
                }
            </pre>
        </div>
    );
}