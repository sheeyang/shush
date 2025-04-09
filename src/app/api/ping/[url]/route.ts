import type { NextRequest } from 'next/server'
import { execSync } from 'child_process';

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ url: string }> }
) {
    const { url } = await params;

    const output = execSync("ping " + url, { encoding: 'utf-8' })
        .split(/\r?\n/)
        .filter(e => {
            return e !== '';
        });

    return Response.json({
        url,
        output,
    })
}