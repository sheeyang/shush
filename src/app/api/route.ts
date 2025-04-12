import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl;

  return Response.json({
    message: 'Hello World!',
    url: url.searchParams.get('url'),
    searchParams: Object.fromEntries(url.searchParams),
  });
}
