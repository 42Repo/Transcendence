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

interface UserPrivateDataWithStats extends UserPublicData {
  email: string | null;
  bio: string | null;
  updated_at: string;
  total_wins: number;
  total_losses: number;
}

interface GameMatchData {
  match_id: number;
  player1_id: number;
  player1_username: string;
  player1_avatar_url?: string;
  player2_id: number;
  player2_username: string;
  player2_avatar_url?: string;
  player1_score: number;
  player2_score: number;
  winner_id: number | null;
  match_date: string;
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
        const userStmt = fastify.db.prepare(
          `SELECT
             user_id, username, email, avatar_url, status, created_at, updated_at, bio
           FROM users
           WHERE user_id = ?`
        );
        const userBase = userStmt.get(userId) as
          | Omit<UserPrivateDataWithStats, 'total_wins' | 'total_losses'>
          | undefined;

        if (!userBase) {
          return reply.notFound('User data not found for authenticated user.');
        }

        const winsStmt = fastify.db.prepare(
          'SELECT COUNT(*) as count FROM game_matches WHERE winner_id = ?'
        );
        const winsResult = winsStmt.get(userId) as { count: number };
        const total_wins = winsResult.count;

        const lossesStmt = fastify.db.prepare(
          `SELECT COUNT(*) as count FROM game_matches
           WHERE ((player1_id = ? AND winner_id != ?) OR (player2_id = ? AND winner_id != ?)) AND winner_id IS NOT NULL`
        );
        const lossesResult = lossesStmt.get(userId, userId, userId, userId) as {
          count: number;
        };
        const total_losses = lossesResult.count;

        const user: UserPrivateDataWithStats = {
          ...userBase,
          total_wins,
          total_losses,
        };

        return reply.send({ success: true, user });
      } catch (err) {
        request.log.error(err, `Error fetching data for user ID: ${userId}`);
        return reply.internalServerError('Failed to retrieve user data.');
      }
    }
  );

  fastify.get<{ Params: UserParams }>(
    '/users/:identifier/matches',
    routeOpts,
    async (request, reply) => {
      const { identifier } = request.params;
      let userIdToQuery: number;

      try {
        if (/^\d+$/.test(identifier)) {
          userIdToQuery = parseInt(identifier, 10);
        } else {
          const userLookupStmt = fastify.db.prepare(
            'SELECT user_id FROM users WHERE username = ? COLLATE NOCASE'
          );
          const userFound = userLookupStmt.get(identifier) as
            | { user_id: number }
            | undefined;
          if (!userFound) {
            return reply.notFound(
              `User with username '${identifier}' not found.`
            );
          }
          userIdToQuery = userFound.user_id;
        }

        const matchesStmt = fastify.db.prepare(`
          SELECT
            gm.match_id,
            gm.player1_id,
            p1.username as player1_username,
            p1.avatar_url as player1_avatar_url,
            gm.player2_id,
            p2.username as player2_username,
            p2.avatar_url as player2_avatar_url,
            gm.player1_score,
            gm.player2_score,
            gm.winner_id,
            gm.match_date
          FROM game_matches gm
          JOIN users p1 ON gm.player1_id = p1.user_id
          JOIN users p2 ON gm.player2_id = p2.user_id
          WHERE gm.player1_id = ? OR gm.player2_id = ?
          ORDER BY gm.match_date DESC
          LIMIT 50
        `);
        const matches = matchesStmt.all(
          userIdToQuery,
          userIdToQuery
        ) as GameMatchData[];

        return reply.send({
          success: true,
          matches,
          requested_for_user_id: userIdToQuery,
        });
      } catch (err) {
        request.log.error(
          err,
          `Error fetching match history for identifier: ${identifier}`
        );
        return reply.internalServerError('Failed to retrieve match history.');
      }
    }
  );

  fastify.get<{ Params: UserParams }>(
    '/users/:identifier',
    routeOpts,
    async (request, reply) => {
      const { identifier } = request.params;

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

        // TODO: Add bio and stats here too if public profiles should show them
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
    }
  );

  fastify.log.info(
    'Registered /api/users routes: /me, /:identifier, /:identifier/matches'
  );
}
