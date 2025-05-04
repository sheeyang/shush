import 'server-only';

import { auth } from '@/lib/server/auth';
import { connectProcessStream } from '@/lib/server/process-manager/connect-process-stream';
import { headers } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ processId: string }> },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Unauthorized' }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }

  const { processId } = await params;

  // Get lastOutputTime from query parameters
  const lastOutputTimeParam =
    request.nextUrl.searchParams.get('lastOutputTime');

  // Convert the timestamp to a Date object, or use a fallback (epoch start)
  const lastOutputTime = lastOutputTimeParam
    ? new Date(parseInt(lastOutputTimeParam, 10))
    : new Date(0);

  const response = connectProcessStream(processId, lastOutputTime);

  if (!response.success) {
    return new NextResponse(
      JSON.stringify({ success: false, message: response.message }),
      {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }

  // Next will automatically convert the node Readable to a web ReadableStream
  return new NextResponse(response.stream as unknown as ReadableStream, {
    headers: {
      'Content-Type': 'application/x-msgpack',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Connection: 'keep-alive',
    },
  });
}
