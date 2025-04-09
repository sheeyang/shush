import type { NextRequest } from 'next/server'
import { spawn } from 'child_process';

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ url: string }> }
) {
    const { url } = await params;

    // Create a ReadableStream to stream the command output
    const stream = new ReadableStream({
        start(controller) {
            // Properly spawn the ping command with arguments separated
            const ping = spawn('ping', [url]);

            // Handle stdout data events
            ping.stdout.on('data', (data) => {
                controller.enqueue(data.toString());
            });

            // Handle stderr data events
            ping.stderr.on('data', (data) => {
                controller.enqueue(`Error: ${data.toString()}`);
            });

            // Handle process completion
            ping.on('close', (code) => {
                controller.enqueue(`\nProcess exited with code ${code}`);
                controller.close();
            });

            // Handle process errors
            ping.on('error', (err) => {
                controller.enqueue(`\nProcess error: ${err.message}`);
                controller.close();
            });
        }
    });

    // Return a streaming response
    return new Response(stream, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked',
        },
    });
}