import prisma from '../../db';

export async function getHistoricalOutput(
  processId: string,
  after: Date,
): Promise<string> {
  const processData = await prisma.processData.findUnique({
    where: { id: processId },
    select: {
      processState: true,
      output: {
        where: {
          createdAt: {
            gt: after,
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!processData) return '';

  // console.log({
  //   unsent: processData.output.map((output) => output.data).join(''),
  // });

  return processData.output.map((output) => output.data).join('');
}
