import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyRequest,
  FastifyReply,
} from 'fastify';
import bcrypt from 'bcrypt';

interface RegisterBody {
  username?: string;
  email?: string;
  password?: string;
}

function isValidEmail(email: string): boolean {
  return /\S+@\S+\.\S+/.test(email);
}

export default function (fastify: FastifyInstance, opts: FastifyPluginOptions) {
  fastify.post(
    '/register',
    async (
      request: FastifyRequest<{ Body: RegisterBody }>,
      reply: FastifyReply
    ) => {
      const { username, email, password } = request.body;

      const trimmedUsername = username?.trim();
      const trimmedEmail = email?.trim();

      if (!trimmedUsername || !password) {
        return reply.status(400).send({
          success: false,
          message: 'Username and password are required.',
        });
      }

      if (trimmedUsername.length < 3) {
        return reply.status(400).send({
          success: false,
          message: 'Username must be at least 3 characters long.',
        });
      }
      if (password.length < 6) {
        return reply.status(400).send({
          success: false,
          message: 'Password must be at least 6 characters long.',
        });
      }
      if (trimmedEmail && !isValidEmail(trimmedEmail)) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid email format.',
        });
      }

      try {
        const checkUserStmt = fastify.db.prepare(
          'SELECT user_id FROM users WHERE username = ? OR (email IS NOT NULL AND email = ?)'
        );
        const existingUser = checkUserStmt.get(
          trimmedUsername,
          trimmedEmail || null
        );

        if (existingUser) {
          return reply.status(409).send({
            success: false,
            message: 'Username or email already exists.',
          });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const insertStmt = fastify.db.prepare(
          'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
        );
        const info = insertStmt.run(
          trimmedUsername,
          trimmedEmail || null,
          hashedPassword
        );

        fastify.log.info(`User registered with ID: ${info.lastInsertRowid}`);
        return reply
          .status(201)
          .send({ success: true, message: 'User registered successfully.' });
      } catch (err) {
        request.log.error(err, 'Error during registration');
        return reply.status(500).send({
          success: false,
          message: 'Internal Server Error during registration.',
        });
      }
    }
  );
}
