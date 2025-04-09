"use client";

import { useState, useEffect } from "react";

export default function PingButton() {
    const [pingResult, setPingResult] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isStreaming, setIsStreaming] = useState<boolean>(false);

    const handlePing = async () => {
        try {
            setIsLoading(true);
            setPingResult(""); // Clear previous results
            setIsStreaming(true);

            const response = await fetch("http://localhost:3000/api/ping/www.google.com");

            if (!response.body) {
                setPingResult("Error: Response body is null");
                return;
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            // Process the stream
            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    break;
                }

                // Decode the chunk and append to result
                const chunk = decoder.decode(value, { stream: true });
                setPingResult(prev => prev + chunk);
            }
        } catch (error) {
            setPingResult("Error: Failed to ping");
            console.error(error);
        } finally {
            setIsLoading(false);
            setIsStreaming(false);
        }
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

            {(pingResult || isStreaming) && (
                <div className="mt-4 p-4 border rounded-md bg-gray-50 dark:bg-gray-800 w-full max-w-md overflow-auto max-h-[200px]">
                    <pre className="text-sm whitespace-pre-wrap">{pingResult || "Waiting for response..."}</pre>
                </div>
            )}
        </div>
    );
}