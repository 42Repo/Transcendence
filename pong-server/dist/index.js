"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const websocket_1 = __importDefault(require("@fastify/websocket"));
const pong_1 = require("./pong");
const getGameManager = (player, games) => {
    let result = null;
    result = games.find((game) => {
        return game.getPlayers().some((p) => {
            return player.id === p.id;
        });
    });
    return result ?? null;
};
const start = async () => {
    const server = (0, fastify_1.default)({ logger: true });
    await server.register(websocket_1.default);
    const gameManagers = [];
    const matchMaker = new pong_1.MatchMaking(gameManagers);
    server.get('/health', async () => ({ status: 'pong-server running' }));
    server.get('/ws', { websocket: true }, (socket, request) => {
        let player = null;
        socket.on('message', (msg, isBinary) => {
            const msgStr = isBinary ? msg.toString() : msg;
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
                    }
                    else {
                        socket.send(JSON.stringify({ type: 'wait' }));
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
                    const gamerleft = gameManager.getPlayers().filter((p) => {
                        return p.socket;
                    });
                    const activePlayers = gameManager.getPlayers().filter(p => p.socket);
                    if (activePlayers.length === 0) {
                        const index = gameManagers.indexOf(gameManager);
                        if (index !== -1)
                            gameManagers.splice(index, 1);
                    }
                }
            }
        });
    });
    await server.listen({ port: 4000, host: '0.0.0.0' });
    console.log('Pong server listening on http://localhost:4000');
};
start();
