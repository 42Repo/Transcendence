import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyRequest,
  FastifyReply,
} from 'fastify';
import bcrypt from 'bcrypt';
import FastifyJwt from '@fastify/jwt';

interface RegisterBody {
  username?: string; // TODO: Make this required later
  email?: string; // TODO: Make this required later
  password?: string; // TODO: Make this required later
}

export default function (
  fastify: FastifyInstance,
  opts: FastifyPluginOptions
) {
  fastify.post(
    '/register',
    async (
      request: FastifyRequest<{ Body: RegisterBody }>,
      reply: FastifyReply
    ) => {
      const { username, email, password } = request.body;

      // --- Server-Side Validation ---
      if (!username || !password) {
        return reply.status(400).send({
          success: false,
          message: 'Username and password are required.',
        });
      }

      // --- Check for existing user ---
      try {
        const checkUserStmt = fastify.db.prepare(
          'SELECT user_id FROM users WHERE username = ? OR (email IS NOT NULL AND email = ?)'
        );
        const existingUser = checkUserStmt.get(username, email || null);

        if (existingUser) {
          return reply.status(409).send({
            success: false,
            message: 'Username or email already exists.',
          });
        }

        // --- Hash Password ---
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // --- Insert User into DB ---
        const insertStmt = fastify.db.prepare(
          'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
        );
        const info = insertStmt.run(username, email || null, hashedPassword);

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
