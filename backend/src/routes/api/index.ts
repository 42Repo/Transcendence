import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import pingRoutes from './ping';
import loginRoutes from './login';
import registerRoutes from './register';
import userRoutes from './users';
import verifyRoute from './verify-jwt';

export default function apiIndex(
  fastify: FastifyInstance,
  opts: FastifyPluginOptions
) {
  fastify.register(pingRoutes);
  fastify.register(loginRoutes);
  fastify.register(registerRoutes);
  fastify.register(userRoutes);
  fastify.register(verifyRoute);

  fastify.log.info('Registered API routes: ping, login, register, users');
}
