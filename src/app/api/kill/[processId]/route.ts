import { killProcess } from '@/helpers/createCommandStream';
import type { NextRequest } from 'next/server';

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ processId: string }> }
) {
    const { processId } = await params;

    const success = killProcess(processId);

    return new Response(JSON.stringify({
        success,
        message: success ? 'Process terminated' : 'Process not found'
    }), {
        headers: {
            'Content-Type': 'application/json',
        },
    });
}