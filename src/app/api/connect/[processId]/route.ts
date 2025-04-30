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
    return {
      success: false,
      message: 'Unauthorized',
    } as const;
  }

  const { processId } = await params;

  const response = connectProcessStream(processId);

  if (!response.success) {
    return new Response(response.message, { status: 404 });
  }

  return new Response(response.stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
