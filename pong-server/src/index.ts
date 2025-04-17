import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import WebSocket from 'ws';
import { GameManager } from './pong';

const server = Fastify();
server.register(fastifyWebsocket);

const gameManager = new GameManager();

server.get('/health', async () => ({ status: 'pong-server running' }));

// The handler's first arg IS the ws.WebSocket instance (per plugin types)
server.get('/ws', { websocket: true }, (connection, request) => {
	const { socket } = connection;
console.log("route /ws");
  const playerId = gameManager.addPlayer(socket);   // socket: WebSocket
  socket.on('message', (msg) => {
    gameManager.handlePlayerInput(playerId, msg.toString());
  });
  socket.on('close', () => {
    gameManager.removePlayer(playerId);
  });
});

server.listen({ port: 4000, host: '0.0.0.0' }, (err) => {
	if (err) throw err;
	console.log('Pong server listening on http://localhost:4000');
});
