import Fastify from 'fastify';
import fastifyWebsocket, { type WebSocket } from '@fastify/websocket';
import { type FastifyRequest } from 'fastify';
import { GameManager, MatchMaking } from './pong';
import { PlayerBase, StateGame } from './StateGame';

const getGameManager = (player : PlayerBase, games : GameManager[]) : GameManager | null => {
  let result = null;

  result = games.find((game : GameManager) => {
    return game.getPlayers().some((p : PlayerBase) => {
      return player.id === p.id;
    });
  });
  return result ?? null;
}

const start = async () => {
	const server = Fastify({ logger: true });
	await server.register(fastifyWebsocket);

	const gameManagers : GameManager[] = [];
  const matchMaker = new MatchMaking(gameManagers);

	server.get('/health', async () => ({ status: 'pong-server running' }));

  server.get('/ws',
    { websocket: true },
    (socket: WebSocket , request: FastifyRequest) => {

      let player : PlayerBase | null = null;

      socket.on('message', (msg: string, isBinary: boolean) => {
        const msgStr = isBinary ? msg.toString() : msg as string;
        const message = JSON.parse(msgStr);
        console.log(message);
        const { type, data } = message;
        switch (type) {
          case 'join':
            const result = (matchMaker.addPlayer(socket, data.name));
            player = result.player;
            if (result.game) {
              gameManagers.push(result.game);
              result.game.startGame();
            } else {
              socket.send(JSON.stringify({type:'wait'}));
            }
            break;
          case 'input':
            if (player) {
              const gameManager = getGameManager(player, gameManagers);
              if (gameManager) {
                console.log("DATA:", data);
                gameManager.handlePlayerInput(player, data);
              }
            }
          default:
            break;
        }
      });

      socket.on('close', () => {
        if (player) {
          const gameManager = getGameManager(player, gameManagers);
          if (gameManager) {
            gameManager.removePlayer(player);
            const gamerleft = gameManager.getPlayers().filter((p)=>{
              return p.socket;
            });
            const activePlayers = gameManager.getPlayers().filter(p => p.socket);
            if (activePlayers.length === 0) {
              const index = gameManagers.indexOf(gameManager);
              if (index !== -1) gameManagers.splice(index, 1);
            }
          }
        }
      });
    }
  );

  await server.listen({ port: 4000, host: '0.0.0.0' });
  console.log('Pong server listening on http://localhost:4000');
}

start();
