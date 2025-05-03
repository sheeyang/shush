import prisma from '../db';

export async function addProcess(
  command: string,
  args: string[],
  label: string,
): Promise<string> {
  const processId = crypto.randomUUID();

  // Store in database
  await prisma.processData.create({
    data: {
      id: processId,
      label,
      processState: 'initialized',
      command: command,
      args: JSON.stringify(args),
    },
  });

  console.log(`Process ${processId} added to database.`);

  return processId;
}
