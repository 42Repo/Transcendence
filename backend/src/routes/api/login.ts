import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyRequest,
  FastifyReply,
} from 'fastify';

interface QueryParams {
  email?: string;
  password?: string;
}

export default async function (
  fastify: FastifyInstance,
  opts: FastifyPluginOptions
) {
  fastify.get('/login', async (request: FastifyRequest<{ Querystring: QueryParams }>, reply: FastifyReply) => {
    const { email, password } = request.query;

    fastify.log.info(`Email: ${email}`);
    fastify.log.info(`Password: ${password}`);

    reply.send({ success: true, message: "Requête reçue !" });
  });
}