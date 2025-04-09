"use client";

import { useStreamFetch } from "@/hooks/useStreamFetch";
import { useState } from "react";
import CommandOutput from "./CommandOutput";

export default function TikTokButton() {
    const { data, isStreaming, error, fetchStream } = useStreamFetch();
    const [username, setUsername] = useState("");

    const handlePing = async () => {
        await fetchStream(`http://localhost:3000/api/tiktok/${username}`);
    };

    return (
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
                    {isStreaming ? "Loading..." : "Search"}
                </button>
            </div>
            <CommandOutput output={data} error={error} />
        </div>
    );
}