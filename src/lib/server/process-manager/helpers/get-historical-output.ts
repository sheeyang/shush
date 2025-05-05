import prisma from '../../db';

interface DateFilter {
  gt?: Date;
  lt?: Date;
}

interface HistoricalOutputOptions {
  after?: Date;
  before?: Date;
  limit?: number;
}

export async function getHistoricalOutput(
  processId: string,
  options: HistoricalOutputOptions = {},
): Promise<string> {
  const { after, before, limit } = options;

  // Create properly typed date filter object
  const dateFilter: DateFilter = {};

  if (after) {
    dateFilter.gt = after;
  }

  if (before) {
    dateFilter.lt = before;
  }

  const processData = await prisma.processData.findUnique({
    where: { id: processId },
    select: {
      processState: true,
      output: {
        where: {
          createdAt:
            Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
        },
        orderBy: { createdAt: 'asc' },
        ...(limit !== undefined && { take: limit }),
      },
    },
  });

  if (!processData) return '';

  return processData.output.map((output) => output.data).join('');
}
