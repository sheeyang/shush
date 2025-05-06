import 'server-only';

import { getCurrentSession } from '@/lib/server/session';
import { connectProcessStream } from '@/lib/server/process-manager/connect-process-stream';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ processId: string }> },
) {
  const { session } = await getCurrentSession();

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

  try {
    const stream = await connectProcessStream(processId, lastOutputTime);
    // Next will automatically convert the node Readable to a web ReadableStream
    return new NextResponse(stream as unknown as ReadableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    return new NextResponse(String(error), {
      status: 404,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }
}
