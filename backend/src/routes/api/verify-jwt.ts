import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyRequest,
  FastifyReply,
} from 'fastify';

export default function (fastify: FastifyInstance, opts: FastifyPluginOptions) {
  fastify.post(
    '/verify-jwt',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            token: { type: 'string' },
          },
          required: ['token'],
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: { token: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { token } = request.body;

        const decoded: any = fastify.jwt.decode(token);

        if (!decoded || !decoded.id) {
          return reply.status(400).send({
            success: false,
            message: 'Invalid token format.',
          });
        }

        const userStmt = fastify.db.prepare(
          'SELECT user_id FROM users WHERE user_id = ?'
        );
        const user = userStmt.get(decoded.id);

        if (!user) {
          return reply.status(404).send({
            success: false,
            message: 'User not found.',
          });
        }

        return reply.status(200).send({
          success: true,
          message: 'Token is valid, user exists.',
        });
      } catch (err) {
        request.log.error(err, 'Error during JWT verification');
        return reply.status(500).send({
          success: false,
          message: 'Internal Server Error during token verification.',
        });
      }
    }
  );
}
