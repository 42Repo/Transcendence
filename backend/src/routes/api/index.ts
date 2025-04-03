import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import pingRoutes from './ping';
import loginRoutes from './login';

export default function (fastify: FastifyInstance, opts: FastifyPluginOptions) {
  fastify.register(pingRoutes, { prefix: '/api' });
  fastify.register(loginRoutes, { prefix: '/api' });
  fastify.log.info('Registered /api routes');
}
