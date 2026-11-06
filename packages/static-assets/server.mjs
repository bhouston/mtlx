// Local stand-in for https://mtlx-static.ben3d.ca: same files, same headers as the GCS bucket.
import fastifyStatic from '@fastify/static';
import Fastify from 'fastify';
import { fileURLToPath } from 'node:url';

const app = Fastify();
await app.register(fastifyStatic, {
  root: fileURLToPath(new URL('./public', import.meta.url)),
  // Cache-Control: public, max-age=31536000, immutable. Directory listing stays off (list: false).
  maxAge: '1y',
  immutable: true,
  // Fetched cross-origin by the website and by <material-viewer> embeds on other sites.
  setHeaders: (reply) => reply.header('Access-Control-Allow-Origin', '*'),
});
const address = await app.listen({ port: Number(process.env.PORT ?? 3001) });
console.log(`Static assets at ${address}`);
