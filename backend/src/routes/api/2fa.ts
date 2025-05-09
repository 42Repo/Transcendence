import { FastifyInstance } from 'fastify';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';
import { UserJwtPayload } from '../../server';

interface TwoFAUser {
        username: string;
        user_id: number;
        twofa_enabled: boolean;
}

function getUserByID(
        fastify: FastifyInstance,
        id: number
): TwoFAUser | undefined {
        try {
                const findUserStmt = fastify.db.prepare(
                        'SELECT username, user_id, is_two_factor_enabled FROM users WHERE user_id = ?'
                );
                const user = findUserStmt.get(id) as TwoFAUser;

                if (!user) {
                        console.log('Erreur : utilisateur introuvable dans la DB');
                        return;
                }
                return user;
        } catch (error) {
                console.log('Error while searchin user: ' + error);
                return;
        }
}

function setUserSecret(fastify: FastifyInstance, secret: string, id: number) {
        try {
                const userUpdateStmt = fastify.db.prepare(
                        'UPDATE users SET two_factor_secret = ? WHERE user_id = ?'
                );
                userUpdateStmt.run(secret, id);
        } catch (error) {
                console.log(error);
        }
}

export default async function (fastify: FastifyInstance) {
        fastify.post('/2fa/setup', {
                onRequest: [fastify.authenticate],
                handler: async (request, reply) => {
                        try {
                                const authHeader = request.headers.authorization;
                                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                                        console.error('No Authorization header or invalid format');
                                        return reply.status(401).send({
                                                success: false,
                                                message: 'Authorization header missing or invalid',
                                        });
                                }

                                const token = authHeader.substring(7);

                                let decodedToken: UserJwtPayload | null;
                                try {
                                        decodedToken = fastify.jwt.decode(token);
                                } catch (error) {
                                        console.error('Failed to decode token:', error);
                                        return reply
                                                .status(401)
                                                .send({ success: false, message: 'Invalid token format' });
                                }

                                if (!decodedToken || !decodedToken.id) {
                                        console.error('Token does not contain user ID');
                                        return reply
                                                .status(401)
                                                .send({ success: false, message: 'Invalid token content' });
                                }
                                const userId = decodedToken.id;

                                const user = getUserByID(fastify, userId);
                                if (!user) {
                                        console.error(`User with ID ${userId} not found in database`);
                                        return reply
                                                .status(404)
                                                .send({ success: false, message: 'User not found' });
                                }

                                if (user.twofa_enabled) {
                                        console.log(`User ${user.username} already has 2FA enabled`);
                                        return reply
                                                .status(400)
                                                .send({ success: false, message: '2FA is already enabled' });
                                }

                                const secret = authenticator.generateSecret();

                                const otpAuthUrl = authenticator.keyuri(
                                        user.username,
                                        'transcendence',
                                        secret
                                );

                                setUserSecret(fastify, secret, userId);

                                const qrCodeUrl = await qrcode.toDataURL(otpAuthUrl);
                                const qrCodeImage = await qrcode.toString(otpAuthUrl, {
                                        type: 'terminal',
                                });

                                return reply.status(200).send({
                                        success: true,
                                        qrCode: qrCodeUrl,
                                        qrCodeImage: qrCodeImage,
                                });
                        } catch (error) {
                                console.error('Error in 2FA setup:', error);
                                return reply.status(500).send({
                                        success: false,
                                        message: 'Internal Server Error',
                                        details: error,
                                });
                        }
                },
        });

        fastify.post('/2fa/confirm', async (request, reply) => {
                const { code, token } = request.body as { code: string; token: string };

                let decoded: any;
                try {
                        decoded = fastify.jwt.verify(token); // vérifie et décode le JWT
                } catch (err) {
                        return reply
                                .status(401)
                                .send({ success: false, message: 'Invalid token' });
                }

                const userId = decoded.id; // ou decoded.user_id selon comment tu l'as signé

                if (!userId) {
                        return reply
                                .status(401)
                                .send({ success: false, message: 'Unauthorized' });
                }

                // Récupération du secret dans la DB
                console.log('id = ' + userId);
                const stmt = fastify.db.prepare(`
    SELECT two_factor_secret FROM users WHERE user_id = ?
  `);
                const row = stmt.get(userId) as { two_factor_secret?: string };

                if (!row || !row.two_factor_secret) {
                        return reply
                                .status(400)
                                .send({ success: false, message: '2FA not initialized' });
                }

                const secret = row.two_factor_secret;

                const isValid = authenticator.check(code, secret);
                if (!isValid) {
                        return reply
                                .status(400)
                                .send({ success: false, message: 'Invalid 2FA code' });
                }

                // Mise à jour : activation du 2FA et stockage du secret
                const updateStmt = fastify.db.prepare(`
    UPDATE users
    SET is_two_factor_enabled = 1
    WHERE user_id = ?
  `);
                updateStmt.run(userId);

                return reply.send({ success: true });
        });
//fastify.post<TokenRequest>('/2fa/delete', {

//});
}
