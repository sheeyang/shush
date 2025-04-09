"use client";

import { useStreamFetch } from "@/hooks/useStreamFetch";
import CommandOutput from "@/components/CommandOutput";

export default function PingButton() {
    const { data, isStreaming, error, fetchStream, killStream } = useStreamFetch();

    const handlePing = async () => {
        await fetchStream("http://localhost:3000/api/ping/www.google.com");
    };

    return (
        <div className="flex flex-col items-center">
            <div className="flex gap-2 w-full justify-center">
                <button
                    className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
                    onClick={handlePing}
                    disabled={isStreaming}
                >
                    {isStreaming ? "Pinging..." : "Ping Google"}
                </button>
                {isStreaming && (
                    <button
                        className="rounded-full border border-solid border-red-500 text-red-500 transition-colors flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
                        onClick={killStream}
                    >
                        Stop (Ctrl+C)
                    </button>
                )}
            </div>
            <CommandOutput output={data} error={error} />
        </div>
    );
}