import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyRequest,
  FastifyReply,
  RouteShorthandOptions,
} from 'fastify';
import bcrypt from 'bcrypt';

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
  has_password?: boolean;
  is_two_factor_enabled?: boolean;
}

interface GameMatchData {
  match_id: number;
  player1_id: number | null;
  player1_username: string | null;
  player1_guest_name: string | null;
  player1_avatar_url?: string | null;
  player2_id: number | null;
  player2_username: string | null;
  player2_guest_name: string | null;
  player2_avatar_url?: string | null;
  player1_score: number;
  player2_score: number;
  winner_id: number | null;
  match_date: string;
  player1_touched_ball: number;
  player1_missed_ball: number;
  player1_touched_ball_in_row: number;
  player1_missed_ball_in_row: number;
  player2_touched_ball: number;
  player2_missed_ball: number;
  player2_touched_ball_in_row: number;
  player2_missed_ball_in_row: number;
}

interface UpdateUserBody {
  username?: string;
  email?: string;
  bio?: string;
  current_password?: string;
  new_password?: string;
  avatar_url?: string;
}

function isValidEmail(email: string): boolean {
  return /\S+@\S+\.\S+/.test(email);
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
             user_id, username, email, avatar_url, status, created_at, updated_at, bio, password_hash, is_two_factor_enabled
           FROM users
           WHERE user_id = ?`
        );
        type UserWithPasswordHash = Omit<
          UserPrivateDataWithStats,
          'total_wins' | 'total_losses' | 'has_password'
        > & { password_hash: string | null };

        const userBase = userStmt.get(userId) as
          | UserWithPasswordHash
          | undefined;

        if (!userBase) {
          return reply.notFound('User data not found for authenticated user.');
        }
        const is_two_factor_enabled = !!userBase.is_two_factor_enabled;
        const has_password = !!userBase.password_hash;
        const { password_hash, ...userBaseWithoutPasswordHash } = userBase;
        const winsStmt = fastify.db.prepare(
          'SELECT COUNT(*) as count FROM game_matches WHERE winner_id = ?'
        );
        const winsResult = winsStmt.get(userId) as { count: number };
        const total_wins = winsResult.count;

        const lossesStmt = fastify.db.prepare(
          `SELECT COUNT(*) as count FROM game_matches
           WHERE ((player1_id = ? AND winner_id != ? AND winner_id IS NOT NULL) OR 
                  (player2_id = ? AND winner_id != ? AND winner_id IS NOT NULL) OR
                  (player1_id = ? AND winner_id IS NULL AND player1_score < player2_score) OR
                  (player2_id = ? AND winner_id IS NULL AND player2_score < player1_score))
          `
        );
        const lossesResult = lossesStmt.get(
          userId,
          userId,
          userId,
          userId,
          userId,
          userId
        ) as {
          count: number;
        };
        const total_losses = lossesResult.count;

        const user: UserPrivateDataWithStats = {
          ...userBaseWithoutPasswordHash,
          total_wins,
          total_losses,
          has_password,
          is_two_factor_enabled,
        };

        return reply.send({ success: true, user });
      } catch (err) {
        request.log.error(err, `Error fetching data for user ID: ${userId}`);
        return reply.internalServerError('Failed to retrieve user data.');
      }
    }
  );

  fastify.put<{ Body: UpdateUserBody }>(
    '/users/me',
    routeOpts,
    async (request, reply) => {
      const userId = request.user.id;
      const {
        username,
        email,
        bio,
        current_password,
        new_password,
        avatar_url,
      } = request.body;

      const updates: { [key: string]: any } = {};
      const params: any[] = [];
      let usernameChanged = false;

      try {
        const currentUserStmt = fastify.db.prepare(
          'SELECT username, email, password_hash FROM users WHERE user_id = ?'
        );
        const currentUserData = currentUserStmt.get(userId) as
          | {
              username: string;
              email: string | null;
              password_hash: string | null;
            }
          | undefined;

        if (!currentUserData) {
          return reply.notFound('User not found.');
        }

        if (
          username !== undefined &&
          username.trim() !== currentUserData.username
        ) {
          const trimmedUsername = username.trim();
          if (trimmedUsername.length < 3) {
            return reply.badRequest(
              'Username must be at least 3 characters long.'
            );
          }
          const existingUserStmt = fastify.db.prepare(
            'SELECT user_id FROM users WHERE username = ? AND user_id != ?'
          );
          const existingUser = existingUserStmt.get(trimmedUsername, userId);
          if (existingUser) {
            return reply.conflict('Username already taken.');
          }
          updates.username = trimmedUsername;
          usernameChanged = true;
        }

        if (email !== undefined) {
          const trimmedEmail = email.trim();
          if (trimmedEmail === '' && currentUserData.email !== null) {
            updates.email = null;
          } else if (
            trimmedEmail !== '' &&
            trimmedEmail !== currentUserData.email
          ) {
            if (!isValidEmail(trimmedEmail)) {
              return reply.badRequest('Invalid email format.');
            }
            const existingUserStmt = fastify.db.prepare(
              'SELECT user_id FROM users WHERE email = ? AND user_id != ?'
            );
            const existingUser = existingUserStmt.get(trimmedEmail, userId);
            if (existingUser) {
              return reply.conflict('Email already taken.');
            }
            updates.email = trimmedEmail;
          }
        }

        if (bio !== undefined) {
          updates.bio = bio.trim().substring(0, 300);
        }

        if (new_password) {
          if (new_password.length < 6) {
            return reply.badRequest(
              'New password must be at least 6 characters long.'
            );
          }
          if (currentUserData.password_hash) {
            if (!current_password) {
              return reply.badRequest(
                'Current password is required to change password.'
              );
            }
            const match = await bcrypt.compare(
              current_password,
              currentUserData.password_hash
            );
            if (!match) {
              return reply.unauthorized('Incorrect current password.');
            }
          } else {
          }
          updates.password_hash = await bcrypt.hash(new_password, 10);
        } else if (current_password && !new_password) {
          if (currentUserData.password_hash) {
            return reply.badRequest(
              'New password is required when current password is provided for a password change.'
            );
          }
        }
        if (avatar_url !== undefined) {
          updates.avatar_url = avatar_url.trim();
        }

        if (Object.keys(updates).length === 0) {
          return reply.send({ success: true, message: 'No changes detected.' });
        }

        const setClauses = Object.keys(updates)
          .map((key) => `${key} = ?`)
          .join(', ');
        params.push(...Object.values(updates));
        params.push(userId);

        const updateQuery = `UPDATE users SET ${setClauses}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`;
        const stmt = fastify.db.prepare(updateQuery);
        stmt.run(...params);

        const updatedUserStmt = fastify.db.prepare(
          'SELECT user_id, username, email, avatar_url, status, created_at, updated_at, bio, password_hash FROM users WHERE user_id = ?'
        );
        type UpdatedUserWithPasswordHash = UserPrivateDataWithStats & {
          password_hash: string | null;
        };
        const updatedUserData = updatedUserStmt.get(userId) as
          | UpdatedUserWithPasswordHash
          | undefined;

        if (!updatedUserData) {
          return reply.internalServerError(
            'Failed to retrieve updated user details.'
          );
        }

        const has_password_after_update = !!updatedUserData.password_hash;

        const { password_hash: _, ...updatedUserWithoutPasswordHash } =
          updatedUserData;

        let newToken: string | undefined = undefined;
        if (usernameChanged) {
          newToken = await reply.jwtSign(
            {
              id: updatedUserWithoutPasswordHash.user_id,
              username: updatedUserWithoutPasswordHash.username,
            },
            { expiresIn: '1h' }
          );
        }

        const finalUpdatedUser: UserPrivateDataWithStats = {
          ...updatedUserWithoutPasswordHash,
          has_password: has_password_after_update,
        };

        return reply.send({
          success: true,
          message: 'Profile updated successfully.',
          user: finalUpdatedUser,
          token: newToken,
        });
      } catch (err) {
        request.log.error(err, 'Error updating user profile');
        if (
          err instanceof Error &&
          (err.message.includes('UNIQUE constraint failed: users.username') ||
            err.message.includes('UNIQUE constraint failed: users.email'))
        ) {
          return reply.conflict(
            err.message.includes('users.username')
              ? 'Username already taken.'
              : 'Email already taken.'
          );
        }
        return reply.internalServerError('Failed to update profile.');
      }
    }
  );

  fastify.delete(
    '/users/me',
    routeOpts,
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.user.id;

      try {
        const stmt = fastify.db.prepare('DELETE FROM users WHERE user_id = ?');
        const info = stmt.run(userId);

        if (info.changes > 0) {
          request.log.info(`User ${userId} deleted successfully.`);
          return reply.send({
            success: true,
            message: 'Account deleted successfully.',
          });
        } else {
          request.log.warn(
            `Attempted to delete non-existent user or user already deleted: ${userId}`
          );
          return reply.notFound('User not found or already deleted.');
        }
      } catch (err) {
        request.log.error(err, `Error deleting user ID: ${userId}`);
        return reply.internalServerError('Failed to delete account.');
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
            gm.player1_guest_name,
            gm.player2_id,
            p2.username as player2_username,
            p2.avatar_url as player2_avatar_url,
            gm.player2_guest_name,
            gm.player1_score,
            gm.player2_score,
            gm.winner_id,
            gm.match_date,
            gm.player1_touched_ball,
            gm.player1_missed_ball,
            gm.player1_touched_ball_in_row,
            gm.player1_missed_ball_in_row,
            gm.player2_touched_ball,
            gm.player2_missed_ball,
            gm.player2_touched_ball_in_row,
            gm.player2_missed_ball_in_row
          FROM game_matches gm
          LEFT JOIN users p1 ON gm.player1_id = p1.user_id
          LEFT JOIN users p2 ON gm.player2_id = p2.user_id
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
    'Registered /api/users routes: GET /me, PUT /me, DELETE /me, GET /:identifier, GET /:identifier/matches'
  );
}
