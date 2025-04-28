import prisma from '../../db';

export async function sendHistoricalOutput(
  processId: string,
  send: (data: string, event?: string) => void,
): Promise<void> {
  const processData = await prisma.processData.findUnique({
    where: { id: processId },
    select: {
      processState: true,
      output: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!processData) return;

  processData.output.forEach((outputRecord) => {
    send(outputRecord.data);
  });
}
