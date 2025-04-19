import { connectCommandStream } from '@/server/process-manager';
import type { NextRequest } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ processId: string }> },
) {
  const { processId } = await params;

  const response = await connectCommandStream(processId);

  if (!response.success) {
    return new Response(response.message, { status: 404 });
  }

  return new Response(response.stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  });
}
