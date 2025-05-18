export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { existsSync, mkdirSync } = await import('fs');
    const path = await import('path');

    // create logs folder if it does not exist
    const logsDir = path.join(process.cwd(), 'logs');
    if (!existsSync(logsDir)) {
      mkdirSync(logsDir);
    }
  }
}
