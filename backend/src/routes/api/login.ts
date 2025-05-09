import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyRequest,
  FastifyReply,
} from 'fastify';
import bcrypt from 'bcrypt';

interface LoginBody {
  loginIdentifier: string; // Username or email
  password: string;
}

export default function (fastify: FastifyInstance, opts: FastifyPluginOptions) {
  fastify.post(
    '/login',
    async (
      request: FastifyRequest<{ Body: LoginBody }>,
      reply: FastifyReply
    ) => {
      const { loginIdentifier, password } = request.body;

      const trimmedIdentifier = loginIdentifier?.trim();
      const trimmedPassword = password?.trim();

      if (!trimmedIdentifier || !trimmedPassword) {
        return reply.status(400).send({
          success: false,
          message: 'Username/email and password are required.',
        });
      }

      try {
        const findUserStmt = fastify.db.prepare(
          'SELECT user_id, username, password_hash, google_id FROM users WHERE username = ? OR email = ?'
        );
        const user = findUserStmt.get(trimmedIdentifier, trimmedIdentifier) as
          | {
              user_id: number;
              username: string;
              password_hash: string | null;
              google_id: string | null;
            }
          | undefined;

        if (!user) {
          return reply
            .status(401)
            .send({ success: false, message: 'Invalid credentials.' });
        }

        if (!user.password_hash && user.google_id) {
          return reply.status(401).send({
            success: false,
            message:
              'This account is linked with Google. Please use Google Sign-In.',
            code: 'GOOGLE_ACCOUNT_NO_PASSWORD',
          });
        }

        if (!user.password_hash) {
          request.log.warn(
            `User ${user.username} (ID: ${user.user_id}) has no password set and is not a Google-only account. Login denied.`
          );
          return reply.status(401).send({
            success: false,
            message: 'Invalid credentials or account setup issue.',
          });
        }

        const match = await bcrypt.compare(trimmedPassword, user.password_hash);

        if (match) {
          fastify.log.info(`User ${user.username} logged in successfully.`);

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
        } else {
          fastify.log.warn(`Failed login attempt for ${trimmedIdentifier}`);
          return reply
            .status(401)
            .send({ success: false, message: 'Invalid credentials.' });
        }
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
