import type { NextRequest } from 'next/server'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    const url = request.nextUrl
    const { username } = await params;

    return Response.json({
        message: 'Hello World!',
        url: url.searchParams.get('url'),
        username: username,
        searchParams: Object.fromEntries(url.searchParams),
    })
}