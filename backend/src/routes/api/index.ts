import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import pingRoutes from './ping';
import loginRoutes from './login';
import googleLoginRoutes from './google-login';
import registerRoutes from './register';
import userRoutes from './users';
import verifyRoute from './verify-jwt';
import matchesRoutes from './matches';
import { cloudinaryRoutes } from './cloudinary';
import fastifyMultipart from '@fastify/multipart';
import dotenv from 'dotenv';

dotenv.config();

export default function apiIndex(
  fastify: FastifyInstance,
  opts: FastifyPluginOptions
) {
  fastify.register(fastifyMultipart);
  fastify.register(pingRoutes);
  fastify.register(loginRoutes);
  fastify.register(registerRoutes);
  fastify.register(userRoutes);
  fastify.register(verifyRoute);
  fastify.register(matchesRoutes);
  fastify.register(googleLoginRoutes);
  fastify.register(cloudinaryRoutes);

  fastify.log.info(
    'Registered API routes: ping, login, register, users, verify-jwt, matches'
  );
}
