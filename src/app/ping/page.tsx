"use client";

import CommandCard from "@/components/command-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function PingPage() {
    const [address, setAddress] = useState("www.google.com");
    const [streamList, setStreamList] = useState<string[]>([]);

    const handleSubmit = () => {
        setStreamList([...streamList, address]);
    }

    return (
        <div className="w-full flex flex-col items-center pt-[20vh] min-h-[calc(100vh-2rem)] overflow-y-auto gap-2">
            <Card className="w-lg">
                <CardContent className="flex flex-row gap-2">
                    <Input
                        value={address}
                        placeholder="Address"
                        onChange={(e) => setAddress(e.target.value)}
                    />
                    <Button
                        variant="outline"
                        onClick={handleSubmit}
                    >
                        Add
                    </Button>
                </CardContent>
            </Card>
            {streamList.map((address, index) => (
                <CommandCard
                    key={`${address}-${index}`}
                    api={"http://localhost:3000/api/ping"}
                    endpoint={address}
                    label={address}
                />
            ))}
        </div>
    );
}