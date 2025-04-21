import Fastify from 'fastify';
import fastifyWebsocket, { type WebSocket } from '@fastify/websocket';
import { type FastifyRequest } from 'fastify';
import { GameManager } from './pong';

const start = async () => {
	const server = Fastify({ logger: true });
	await server.register(fastifyWebsocket);
	const gameManager = new GameManager();
	server.get('/health', async () => ({ status: 'pong-server running' }));
	server.get('/ws', { websocket: true }, (socket: WebSocket, request: FastifyRequest) => {
		const playerId = gameManager.addPlayer(socket);
		socket.on('message', (msg: string) => {
			gameManager.handlePlayerInput(playerId, msg);
		});

		socket.on('close', () => {
			gameManager.removePlayer(playerId);
		});
	}
			  );

			  await server.listen({ port: 4000, host: '0.0.0.0' });
			  console.log('Pong server listening on http://localhost:4000');
}

start();
