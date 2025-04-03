import Fastify from 'fastify';
import sensible from '@fastify/sensible';
import cors from '@fastify/cors';
import apiRoutes from './routes/api/index';
import { getDb } from './db/initDb';
import Database from 'better-sqlite3';

declare module 'fastify' {
  interface FastifyInstance {
    db: Database.Database;
  }
}

const fastify = Fastify({
  logger: true,
});

try {
  const db = getDb();
  fastify.decorate('db', db);
  fastify.log.info('Database initialized and decorated.');
} catch (err) {
  fastify.log.error('Failed to initialize database during startup.', err);
  process.exit(1);
}

fastify.register(sensible);
fastify.register(cors, {
  origin: '*',
});

fastify.register(apiRoutes);

fastify.get('/', async (request, reply) => {
  try {
    const stmt = request.server.db.prepare(
      'SELECT COUNT(*) as userCount FROM users'
    );
    const result = stmt.get() as { userCount: number };
    return { message: 'Backend is running bro', userCount: result.userCount };
  } catch (err) {
    request.log.error(err, 'Failed to query users count');
    return reply.internalServerError('Failed to query database');
  }
});

const start = async () => {
  try {
    const port = parseInt(process.env.BACKEND_PORT || '3000', 10);
    await fastify.listen({ port: port, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

void start();
