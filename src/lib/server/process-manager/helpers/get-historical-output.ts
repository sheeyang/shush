import 'server-only';

import prisma from '../../db';

interface HistoricalOutputOptions {
  after?: Date;
  before?: Date;
  limit?: number;
}

export async function getHistoricalOutput(
  processId: string,
  { after, before, limit }: HistoricalOutputOptions = {},
): Promise<string> {
  const processData = await prisma.processData.findUnique({
    where: {
      id: processId,
    },
    select: {
      processState: true,
      output: {
        where: {
          createdAt: {
            ...(after && { gt: after }),
            ...(before && { lt: before }),
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
        ...(typeof limit === 'number' && { take: limit }),
      },
    },
  });

  if (!processData || !processData.output?.length) return '';

  return processData.output.map((output) => output.data).join('');
}
