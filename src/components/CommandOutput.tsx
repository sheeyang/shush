import React from 'react';

interface CommandOutputProps {
    output: string;
    error: string | null;
    maxHeight?: string;
}

export default function CommandOutput({ output, error, maxHeight = "200px" }: CommandOutputProps) {
    return (
        <div className="mt-4 p-4 border border-black/[.08] dark:border-white/[.145] rounded-md bg-[#f9f9f9] dark:bg-[#121212] w-full max-w-md overflow-auto" style={{ maxHeight }}>
            <pre className="text-sm whitespace-pre-wrap text-black/90 dark:text-white/90">
                {
                    error
                        ? `Error: ${error}`
                        : (output || "")
                }
            </pre>
        </div>
    );
}