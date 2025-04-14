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

      // TODO : refactor --- Server-Side Validation ---
      if (!loginIdentifier || !password) {
        return reply.status(400).send({
          success: false,
          message: 'Username/email and password are required.',
        });
      }

      // --- Check for existing user ---
      try {
        const findUserStmt = fastify.db.prepare(
          'SELECT user_id, username, password_hash FROM users WHERE username = ? OR email = ?'
        );
        const user = findUserStmt.get(loginIdentifier, loginIdentifier) as
          | { user_id: number; username: string; password_hash: string }
          | undefined;

        if (!user || !user.password_hash) {
          // TODO : User not found or user has no password (e.g., registered via OAuth later)
          return reply
            .status(401)
            .send({ success: false, message: 'Invalid credentials.' });
        }

        const match = await bcrypt.compare(password, user.password_hash);

        if (match) {
          fastify.log.info(`User ${user.username} logged in successfully.`);

          // TODO: Implement JWT token generation (from JWT Module) here later
          return reply.send({
            success: true,
            message: 'Login successful.',
            // TODO : Send JWT token here
            // token: generatedToken,
            user: { id: user.user_id, username: user.username },
          });
        } else {
          fastify.log.warn(`Failed login attempt for ${loginIdentifier}`);
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
