import Fastify, {
        FastifyInstance,
        FastifyRequest,
        FastifyReply,
} from 'fastify';
import sensible from '@fastify/sensible';
import cors from '@fastify/cors';
import FastifyJwt from '@fastify/jwt';
import apiRoutes from './routes/api/index';
import { getDb } from './db/initDb';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';

dotenv.config();

export interface UserJwtPayload {
        id: number;
        username: string;
}

declare module 'fastify' {
        interface FastifyInstance {
                db: Database.Database;
                authenticate: (
                        request: FastifyRequest,
                        reply: FastifyReply
                ) => Promise<void>;
        }
        interface FastifyRequest {
                user: UserJwtPayload;
        }
}

declare module '@fastify/jwt' {
        interface FastifyJWT {
                payload: UserJwtPayload;
                user: UserJwtPayload;
        }
}
const fastify = Fastify({
        logger: true,
});

try {
        const db = getDb();
        fastify.decorate('db', db);
        fastify.log.info('Database initialized and decorated.');
} catch (err) {
        fastify.log.error('Failed to initialize database during startup.', err);
        process.exit(1);
}

fastify.register(sensible);
fastify.register(cors, {
        origin: '*',
});

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
        fastify.log.error('JWT_SECRET environment variable is not set!');
        process.exit(1);
}
fastify.register(FastifyJwt, {
        secret: jwtSecret,
});

fastify.decorate(
        'authenticate',
        async function (request: FastifyRequest, reply: FastifyReply) {
                try {
                        await request.jwtVerify();
                        if (!request.user || !request.user.id) {
                                throw new Error('Invalid token payload');
                        }
                } catch (err) {
                        fastify.log.warn({ msg: 'JWT Verification failed', error: err });
                        reply.code(401).send({
                                success: false,
                                message: 'Unauthorized: Invalid or missing token.',
                        });
                }
        }
);

fastify.register(apiRoutes, { prefix: '/api' });

fastify.get('/', async (request, reply) => {
        try {
                const stmt = request.server.db.prepare(
                        'SELECT COUNT(*) as userCount FROM users'
                );
                const result = stmt.get() as { userCount: number };
                return { message: 'Backend is running bro', userCount: result.userCount };
        } catch (err) {
                request.log.error(err, 'Failed to query users count');
                return reply.internalServerError('Failed to query database');
        }
});

const start = async () => {
        try {
                const port = 3000;
                await fastify.listen({ port: port, host: '0.0.0.0' });
        } catch (err) {
                fastify.log.error(err);
                process.exit(1);
        }
};

void start();
