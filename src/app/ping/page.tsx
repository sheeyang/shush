"use client";

import CommandOutput from "@/components/command-output";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStreamFetch } from "@/hooks/use-stream-fetch";
import { useState } from "react";

export default function PingPage() {
    const { data, isStreaming, error, fetchStream, killStream } = useStreamFetch();
    const [address, setAddress] = useState("www.google.com");

    const handlePing = async () => {
        await fetchStream(`http://localhost:3000/api/ping/${address}`);
    };

    return (
        <div className="w-full flex flex-col items-center pt-[20vh] min-h-[calc(100vh-2rem)] overflow-y-auto">
            <h1 className="text-2xl font-bold mb-8">Ping Utility</h1>
            <div className="flex flex-col items-center w-lg">
                <div className="flex gap-2 w-full justify-center m-2">
                    <Input
                        value={address}
                        placeholder="Address"
                        onChange={(e) => setAddress(e.target.value)}
                    />
                    <Button
                        variant="outline"
                        onClick={handlePing}
                        disabled={isStreaming}
                    >
                        {isStreaming ? "Pinging..." : "Ping"}
                    </Button>
                    <Button
                        variant="destructive"
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