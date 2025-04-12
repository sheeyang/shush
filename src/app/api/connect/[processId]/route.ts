import { connectCommandStream } from '@/helpers/createCommandStream';
import type { NextRequest } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ processId: string }> },
) {
  const { processId } = await params;

  const { success, message, stream } = connectCommandStream(processId);

  if (!success) {
    return new Response(message, { status: 404 });
  }

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  });
}
