import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyRequest,
  FastifyReply,
} from 'fastify';
import { jwtDecode } from 'jwt-decode';

interface GoogleUser {
  email: string;
  name: string;
  picture: string;
}

interface LoginBody {
  credential: string;
}

function googleRegister(user: GoogleUser, fastify: FastifyInstance) {
  console.log(user);
  const insertStmt = fastify.db.prepare(
    'INSERT INTO users (username, email) VALUES (?, ?)'
  );
  const info = insertStmt.run(user.name, user.email);

  return info;
}

export default function (fastify: FastifyInstance, opts: FastifyPluginOptions) {
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

      let usercreds: GoogleUser;
      try {
        usercreds = jwtDecode<GoogleUser>(credential);
      } catch (err) {
        request.log.error('Invalid JWT credential from Google.');
        return reply.status(401).send({
          success: false,
          message: 'Invalid Google credential.',
        });
      }

      try {
        const findUserStmt = fastify.db.prepare(
          'SELECT user_id, username FROM users WHERE email = ?'
        );
        let user = findUserStmt.get(usercreds.email) as
          | { user_id: number; username: string }
          | undefined;

        if (!user) {
          // TODO: Register via OAuth
          const info = googleRegister(usercreds, fastify);

          fastify.log.info(`User registered with ID: ${info.lastInsertRowid}`);
          const findUserStmt = fastify.db.prepare(
            'SELECT user_id, username FROM users WHERE email = ?'
          );
          user = findUserStmt.get(usercreds.email) as
            | { user_id: number; username: string }
            | undefined;
        }
        if (!user) {
          return reply.status(500).send({
            success: false,
            message: 'Internal Server Error during registration.',
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
      } catch (err) {
        request.log.error(err, 'Error during login');
        return reply.status(500).send({
          success: false,
          message: 'Internal Server Error during login.',
        });
      }
    }
  );
}
