import pino from 'pino';
import pretty from 'pino-pretty';
import path from 'path';

// Create a pretty stream for console output
const prettyStream = pretty({
  colorize: true,
});

// Create a file stream for the logs folder
const fileStream = pino.destination({
  dest: path.join(process.cwd(), 'logs', 'app.log'),
  mkdir: true,
});

// Create a multi-stream to write to both console and file
const logger = pino(
  {},
  pino.multistream([{ stream: prettyStream }, { stream: fileStream }]),
);

export default logger;
