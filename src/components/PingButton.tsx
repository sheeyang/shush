"use client";

import { useStreamFetch } from "@/helpers/useStreamFetch";

export default function PingButton() {
    const { data: pingResult, isLoading, isStreaming, error, fetchStream } = useStreamFetch();

    const handlePing = async () => {
        await fetchStream("http://localhost:3000/api/ping/www.google.com");
    };

    return (
        <div className="flex flex-col items-center">
            <button
                className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
                onClick={handlePing}
                disabled={isLoading}
            >
                {isLoading ? "Pinging..." : "Ping Google"}
            </button>

            {(pingResult || isStreaming || error) && (
                <div className="mt-4 p-4 border rounded-md bg-gray-50 dark:bg-gray-800 w-full max-w-md overflow-auto max-h-[200px]">
                    <pre className="text-sm whitespace-pre-wrap">
                        {error ? `Error: ${error}` :
                            (pingResult || "Waiting for response...")}
                    </pre>
                </div>
            )}
        </div>
    );
}