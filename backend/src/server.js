import Fastify from 'fastify';
import cors from '@fastify/cors';
import './env.js';
import tasksRoutes from './routes/tasks.js';

const app = Fastify({ logger: true });
const { CORS_ORIGIN, PORT} = process.env
await app.register(cors, {
  origin: CORS_ORIGIN || 'http://localhost:5173',
});

app.get('/health', async () => ({ status: 'ok' }));

await app.register(tasksRoutes);

const port = Number(PORT) || 3333;

try {
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`Servidor rodando em http://localhost:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
