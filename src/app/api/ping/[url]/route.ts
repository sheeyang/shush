import type { NextRequest } from 'next/server'
import { spawn } from 'child_process';

// Helper function to create a stream from a command
function createCommandStream(command: string, args: string[]) {
    return new ReadableStream({
        start(controller) {
            const process = spawn(command, args);

            process.stdout.on('data', (data) => {
                controller.enqueue(data.toString());
            });

            process.stderr.on('data', (data) => {
                controller.enqueue(`Error: ${data.toString()}`);
            });

            process.on('close', (code) => {
                controller.enqueue(`\nProcess exited with code ${code}`);
                controller.close();
            });

            process.on('error', (err) => {
                controller.enqueue(`\nProcess error: ${err.message}`);
                controller.close();
            });
        }
    });
}

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ url: string }> }
) {
    const { url } = await params;

    // Use the helper function to create the stream
    const stream = createCommandStream('ping', [url]);

    // Return a streaming response
    return new Response(stream, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked',
        },
    });
}