import { Label } from "@radix-ui/react-label";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import CommandOutput from "./command-output";
import { useStreamFetch } from "@/hooks/use-stream-fetch";

export default function CommandCard({ api, endpoint, label }: { api: string, endpoint: string, label: string }) {
    const { data, isStreaming, error, processId, fetchStream, killStream } = useStreamFetch();
    const handleSubmit = async () => {
        await fetchStream(`${api}/${endpoint}`);
    };
    return (
        <Card className="w-lg">
            <CardHeader className="flex items-center">
                <Label className="w-full">{label}</Label>
                {isStreaming && <Button id="stop" variant="destructive" onClick={killStream}>Stop</Button>}
                {!isStreaming && <Button id="start" variant="default" onClick={handleSubmit}>Start</Button>}
            </CardHeader>
            <CardContent>
                <CommandOutput output={data} error={error} />
            </CardContent>
            <CardFooter className="flex flex-row w-full gap-2">
                <Label className="text-[10px] text-muted-foreground">{processId}</Label>
            </CardFooter>
        </Card>
    )
}