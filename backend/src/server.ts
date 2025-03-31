import Fastify from 'fastify';
import sensible from '@fastify/sensible';
import cors from '@fastify/cors';
import apiRoutes from './routes/api/index';

const fastify = Fastify({
  logger: true,
});

fastify.register(sensible);
fastify.register(cors, {
  origin: '*',
});

fastify.register(apiRoutes);

fastify.get('/', () => {
  return { message: 'Backend is running bro' };
});

const start = async () => {
  try {
    const port = parseInt(process.env.BACKEND_PORT || '3000', 10);
    await fastify.listen({ port: port, host: '0.0.0.0' });
    fastify.log.info(`Backend server listening on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

void start();
