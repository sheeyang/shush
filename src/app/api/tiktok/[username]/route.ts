import { execSync } from 'child_process';


import { createCommandStream } from '@/helpers/createCommandStream';
import type { NextRequest } from 'next/server'

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    const { username } = await params;

    // Use the helper function to create the stream
    const stream = createCommandStream('tlr', [username]);

    // Return a streaming response
    return new Response(stream, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked',
        },
    });
}