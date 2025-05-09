import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyRequest,
  FastifyReply,
} from 'fastify';
import { jwtDecode } from 'jwt-decode';

interface GoogleJwtPayload {
  email: string;
  name: string;
  picture: string;
  sub: string;
  email_verified?: boolean;
}

interface LoginBody {
  credential: string;
}

function sanitizeUsername(name: string): string {
  let sanitized = name.normalize('NFKD').replace(/[^\w\s-]/g, '');
  sanitized = sanitized.replace(/\s+/g, '');
  if (sanitized.length === 0) {
    return 'User';
  }
  return sanitized.substring(0, 20);
}

function getUserByName(fastify: FastifyInstance, username: string) {
  const findUserStmt = fastify.db.prepare(
    'SELECT user_id FROM users WHERE username = ?'
  );
  return findUserStmt.get(username) as { user_id: number } | undefined;
}

export default function (
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  fastify.post(
    '/google-login',
    async (
      request: FastifyRequest<{ Body: LoginBody }>,
      reply: FastifyReply
    ) => {
      const { credential } = request.body;

      if (!credential) {
        return reply.status(400).send({
          success: false,
          message: 'Google Authentication failed. No credential provided.',
        });
      }

      let usercreds: GoogleJwtPayload;
      try {
        usercreds = jwtDecode<GoogleJwtPayload>(credential);
        if (!usercreds.sub || !usercreds.email) {
          request.log.error(
            'Essential fields (sub, email) missing in Google JWT.'
          );
          return reply.status(400).send({
            success: false,
            message: 'Invalid Google credential data.',
          });
        }
      } catch (err) {
        request.log.error(err, 'Invalid JWT credential from Google.');
        return reply.status(401).send({
          success: false,
          message: 'Invalid Google credential.',
        });
      }

      try {
        const findByGoogleIdStmt = fastify.db.prepare(
          'SELECT user_id, username, email, avatar_url FROM users WHERE google_id = ?'
        );
        let user = findByGoogleIdStmt.get(usercreds.sub) as
          | {
              user_id: number;
              username: string;
              email: string | null;
              avatar_url: string | null;
            }
          | undefined;

        if (user) {
          let emailNeedsUpdate = user.email !== usercreds.email;
          const avatarNeedsUpdate =
            user.avatar_url !== usercreds.picture && usercreds.picture;

          if (emailNeedsUpdate) {
            const emailConflictStmt = fastify.db.prepare(
              'SELECT user_id FROM users WHERE email = ? AND user_id != ?'
            );
            const emailConflictUser = emailConflictStmt.get(
              usercreds.email,
              user.user_id
            ) as { user_id: number } | undefined;
            if (emailConflictUser) {
              request.log.warn(
                `Google user ${user.username} (google_id: ${usercreds.sub}) tried to change email to ${usercreds.email}, but it's used by user_id ${emailConflictUser.user_id}. Email update skipped.`
              );
              emailNeedsUpdate = false;
            }
          }

          if (emailNeedsUpdate || avatarNeedsUpdate) {
            const fieldsToUpdate: string[] = [];
            const params: (string | number | null)[] = [];

            if (emailNeedsUpdate) {
              fieldsToUpdate.push('email = ?');
              params.push(usercreds.email);
            }
            if (avatarNeedsUpdate) {
              fieldsToUpdate.push('avatar_url = ?');
              params.push(usercreds.picture);
            }

            if (fieldsToUpdate.length > 0) {
              fieldsToUpdate.push('updated_at = CURRENT_TIMESTAMP');
              params.push(user.user_id);
              const updateStmt = fastify.db.prepare(
                `UPDATE users SET ${fieldsToUpdate.join(', ')} WHERE user_id = ?`
              );
              updateStmt.run(...params);
              if (emailNeedsUpdate) user.email = usercreds.email;
              if (avatarNeedsUpdate) user.avatar_url = usercreds.picture;
              request.log.info(
                `Updated details for Google user ${user.username} (ID: ${user.user_id}).`
              );
            }
          }
        } else {
          const findByEmailStmt = fastify.db.prepare(
            'SELECT user_id, username, email, google_id, avatar_url FROM users WHERE email = ?'
          );
          const existingUserByEmail = findByEmailStmt.get(usercreds.email) as
            | {
                user_id: number;
                username: string;
                email: string | null;
                google_id: string | null;
                avatar_url: string | null;
              }
            | undefined;

          if (existingUserByEmail) {
            if (
              existingUserByEmail.google_id &&
              existingUserByEmail.google_id !== usercreds.sub
            ) {
              request.log.error(
                `Conflict: Email ${usercreds.email} linked to Google ID ${existingUserByEmail.google_id}, new login has Google ID ${usercreds.sub}.`
              );
              return reply.status(409).send({
                success: false,
                message:
                  'This email is already linked to a different Google account.',
              });
            } else if (!existingUserByEmail.google_id) {
              const linkGoogleIdStmt = fastify.db.prepare(
                'UPDATE users SET google_id = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?'
              );
              linkGoogleIdStmt.run(
                usercreds.sub,
                usercreds.picture,
                existingUserByEmail.user_id
              );
              user = {
                user_id: existingUserByEmail.user_id,
                username: existingUserByEmail.username,
                email: existingUserByEmail.email,
                avatar_url: usercreds.picture,
              };
              request.log.info(
                `Linked Google ID ${usercreds.sub} to user ${user.username} (ID: ${user.user_id}) by email.`
              );
            } else {
              user = existingUserByEmail;
            }
          } else {
            const baseName = sanitizeUsername(usercreds.name || 'User');
            let newUsername = baseName;
            let i = 0;
            while (getUserByName(fastify, newUsername)) {
              i++;
              newUsername = baseName + i;
              if (newUsername.length > 20) {
                newUsername = newUsername.substring(0, 18) + i;
              }
            }

            const insertStmt = fastify.db.prepare(
              'INSERT INTO users (username, email, google_id, avatar_url, password_hash) VALUES (?, ?, ?, ?, NULL)'
            );
            const info = insertStmt.run(
              newUsername,
              usercreds.email,
              usercreds.sub,
              usercreds.picture
            );
            user = {
              user_id: Number(info.lastInsertRowid),
              username: newUsername,
              email: usercreds.email,
              avatar_url: usercreds.picture,
            };
            request.log.info(
              `New user registered via Google: ${newUsername} (ID: ${user.user_id})`
            );
          }
        }

        if (!user) {
          request.log.error('User object null after Google auth flow.');
          return reply.status(500).send({
            success: false,
            message: 'Internal Server Error during Google authentication.',
          });
        }

        const generatedToken = await reply.jwtSign(
          {
            id: user.user_id,
            username: user.username,
          },
          { expiresIn: '1h' }
        );

        return reply.send({
          success: true,
          message: 'Login successful.',
          token: generatedToken,
          user: { id: user.user_id, username: user.username },
        });
      } catch (err: any) {
        request.log.error(err, 'Error during Google login/registration');
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          if (err.message.includes('users.email')) {
            return reply.status(409).send({
              success: false,
              message: 'Email address already in use by another account.',
            });
          } else if (err.message.includes('users.google_id')) {
            return reply.status(409).send({
              success: false,
              message: 'This Google account is already associated with a user.',
            });
          } else if (err.message.includes('users.username')) {
            return reply.status(409).send({
              success: false,
              message:
                'Username generation conflict. Please try again or contact support if this persists.',
            });
          }
        }
        return reply.status(500).send({
          success: false,
          message: 'Internal Server Error during Google authentication.',
        });
      }
    }
  );
}
