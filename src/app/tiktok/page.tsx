"use client";

import CommandOutput from "@/components/command-output";
import { useStreamFetch } from "@/hooks/use-stream-fetch";
import { useState } from "react";

export default function TikTokPage() {
    const { data, isStreaming, error, fetchStream, killStream } = useStreamFetch();
    const [username, setUsername] = useState("");

    const handlePing = async () => {
        await fetchStream(`http://localhost:3000/api/tiktok/${username}`);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-2rem)]">
            <h1 className="text-2xl font-bold mb-8">TikTok Utility</h1>
            <div className="flex flex-col items-center">
                <div className="flex gap-2 mb-4 w-full max-w-md">
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter TikTok username"
                        className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        className="rounded-md border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base px-4 py-2"
                        onClick={handlePing}
                        disabled={isStreaming || !username.trim()}
                    >
                        {isStreaming ? "Recording" : "Record"}
                    </button>
                    <button
                        className="rounded-md border border-solid border-red-500 text-red-500 transition-colors flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
                        onClick={killStream}
                        disabled={!isStreaming}
                    >
                        Stop
                    </button>
                </div>
                <CommandOutput output={data} error={error} />
            </div>
        </div>
    );
}