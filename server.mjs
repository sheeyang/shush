import { createServer as createHttpsServer } from 'https';
import { createServer as createHttpServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { readFileSync } from 'fs';

const port = parseInt(process.env.PORT, 10);
const dev = process.env.NODE_ENV !== 'production';
const turbo = process.env.TURBO_PACK === 'true';
const app = next({ dev, turbo });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  if (dev) {
    // Use HTTP for development
    createHttpServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    }).listen(port);
  } else {
    // Use HTTPS for production
    const options = {
      key: readFileSync('certificates/key.pem'),
      cert: readFileSync('certificates/cert.pem'),
    };

    createHttpsServer(options, (req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    }).listen(port);
  }

  console.log(
    `> Server started on ${dev ? 'http' : 'https'}://localhost:${port} and ${turbo ? 'Turbopack' : 'Webpack'} in ${dev ? 'development' : 'production'} mode.`,
  );
});
