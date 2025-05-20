import { createServer } from 'https';
import { parse } from 'url';
import next from 'next';
import { readFileSync } from 'fs';

const port = parseInt(process.env.PORT, 10);
const dev = process.env.NODE_ENV !== 'production';
const turbo = process.env.TURBO_PACK === 'true';
const app = next({ dev, turbo });
const handle = app.getRequestHandler();

// TODO: make it so that certifcates are optional
const options = {
  key: readFileSync('certificates/key.pem'),
  cert: readFileSync('certificates/cert.pem'),
};

app.prepare().then(() => {
  createServer(options, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port);

  console.log(
    `> Server started with port ${port} and ${turbo ? 'Turbopack' : 'Webpack'} in ${dev ? 'development' : 'production'} mode`,
  );
});
