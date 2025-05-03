import 'server-only';

import { auth } from '@/lib/server/auth';
import { connectProcessStream } from '@/lib/server/process-manager/connect-process-stream';
import { headers } from 'next/headers';
import type { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ processId: string }> },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return new Response(
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

  const response = connectProcessStream(processId);

  if (!response.success) {
    return new Response(
      JSON.stringify({ success: false, message: response.message }),
      {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }

  return new Response(response.stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
