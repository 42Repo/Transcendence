import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import pingRoutes from './ping';

export default async function (
  fastify: FastifyInstance,
  opts: FastifyPluginOptions
) {
  fastify.register(pingRoutes, { prefix: '/api' });
  fastify.log.info('Registered /api routes');
}
