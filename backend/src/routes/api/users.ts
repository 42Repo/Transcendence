import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyRequest,
  FastifyReply,
  RouteShorthandOptions,
} from 'fastify';

interface UserParams {
  identifier: string;
}

interface UserPublicData {
  user_id: number;
  username: string;
  avatar_url: string | null;
  status: string;
  created_at: string;
}

interface UserPrivateData extends UserPublicData {
  email: string | null;
  preferred_language: string;
  updated_at: string;
}

export default function userRoutes(
  fastify: FastifyInstance,
  opts: FastifyPluginOptions
) {
  const routeOpts: RouteShorthandOptions = {
    preValidation: [fastify.authenticate],
  };

  fastify.get(
    '/users/me',
    routeOpts,
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.user.id;

      try {
        const stmt = fastify.db.prepare(
          `SELECT
           user_id, username, email, avatar_url, status, created_at, updated_at, preferred_language
         FROM users
         WHERE user_id = ?`
        );
        const user = stmt.get(userId) as UserPrivateData | undefined;

        if (!user) {
          return reply.notFound('User data not found for authenticated user.');
        }

        return reply.send({ success: true, user });
      } catch (err) {
        request.log.error(err, `Error fetching data for user ID: ${userId}`);
        return reply.internalServerError('Failed to retrieve user data.');
      }
    }
  );

  fastify.get('/users/:identifier', routeOpts, async (request, reply) => {
    const identifier = (request.params as UserParams).identifier;

    try {
      const isNumericId = /^\d+$/.test(identifier);
      let queryValue: number | string;
      let whereClause: string;

      if (isNumericId) {
        queryValue = parseInt(identifier, 10);
        whereClause = 'user_id = ?';
      } else {
        queryValue = identifier;
        whereClause = 'username = ? COLLATE NOCASE';
      }

      const stmt = fastify.db.prepare(
        `SELECT user_id, username, avatar_url, status, created_at FROM users WHERE ${whereClause}`
      );
      const user = stmt.get(queryValue) as UserPublicData | undefined;

      if (!user) {
        return reply.notFound(
          `User with identifier '${identifier}' not found.`
        );
      }

      return reply.send({ success: true, user });
    } catch (err) {
      request.log.error(
        err,
        `Error fetching data for identifier: ${identifier}`
      );
      return reply.internalServerError('Failed to retrieve user data.');
    }
  });

  fastify.log.info('Registered /api/users routes: /me, /:identifier');
}
