"use client";

import CommandOutput from "@/components/CommandOutput";
import { Button } from "@/components/ui/button";
import { useStreamFetch } from "@/hooks/useStreamFetch";

export default function PingPage() {
    const { data, isStreaming, error, fetchStream, killStream } = useStreamFetch();

    const handlePing = async () => {
        await fetchStream("http://localhost:3000/api/ping/www.google.com");
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-2rem)]">
            <h1 className="text-2xl font-bold mb-8">Ping Utility</h1>
            <div className="flex flex-col items-center">
                <div className="flex gap-2 w-full justify-center">
                    {/* <button
                        className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
                        onClick={handlePing}
                        disabled={isStreaming}
                    >
                        {isStreaming ? "Pinging..." : "Ping Google"}
                    </button>
                    <button
                        className="rounded-md border border-solid border-red-500 text-red-500 transition-colors flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
                        onClick={killStream}
                        disabled={!isStreaming}
                    >
                        Stop
                    </button> */}
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={handlePing}
                        disabled={isStreaming}
                    >
                        {isStreaming ? "Pinging..." : "Ping Google"}
                    </Button>
                    <Button
                        variant="destructive"
                        size="lg"
                        onClick={killStream}
                        disabled={!isStreaming}
                    >
                        Stop
                    </Button>
                </div>
                <CommandOutput output={data} error={error} />
            </div>
        </div>
    );
}