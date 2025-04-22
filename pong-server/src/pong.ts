import fastifyWebsocket, { type WebSocket } from '@fastify/websocket';
import { v4 as uuidv4 } from 'uuid';
import { StateGame, PlayerBase } from './StateGame';
import { defaultConfig } from './DefaultConf';
import { PongConfig } from './PongConfig';
import { DefaultState } from './DefaultState';

export class MatchMaking {
  private players : PlayerBase[];
  private gameManagers : GameManager[];

  constructor (gameManagers : GameManager[]) {
    this.players = [];
    this.gameManagers = gameManagers;
  }

	addPlayer(socket: WebSocket, name: string):
  { player: PlayerBase, game: GameManager | null } {
    const player : PlayerBase = { id: uuidv4(), socket, name };
    let newGame : GameManager | null = null;

		this.players.push(player);
    if (this.players.length >= 2) {
      const gamePlayers = this.players.slice(0, 2);
      newGame = new GameManager(gamePlayers[0], gamePlayers[1]);
      this.gameManagers.push(newGame);
      this.players = this.players.slice(2);
    }
		return { player: player, game : newGame };
	}
}

export class GameManager {
	private game: StateGame = DefaultState;
	private gameInterval: NodeJS.Timeout | null = null;

	//if (!this.gameInterval) this.startGameLoop();
  constructor (player1 : PlayerBase , player2: PlayerBase) {
    this.init(player1, player2);
  } 


	removePlayer(player: PlayerBase) {

	}

	handlePlayerInput(player: PlayerBase, data: object) {
		// parse input (move left/right/up/down)
		console.log(`Player ${player.name} input:`);
	}

  getPlayers() {
    return this.game.players;
  }

  private init(player1: PlayerBase, player2: PlayerBase, conf: PongConfig = defaultConfig) {
    this.game.players[0].id = player1.id; 
    this.game.players[0].socket = player1.socket;
    this.game.players[0].name = player1.name;
    this.game.paddle[0].id = player1.id;
    this.game.paddle[0].playerName = player1.name;
    this.game.players[1].id = player2.id; 
    this.game.players[1].socket = player2.socket;
    this.game.players[1].name = player2.name;
    this.game.paddle[1].id = player2.id;
    this.game.paddle[1].playerName = player2.name;
    this.game.table.bounds.width = conf.table.width;
    this.game.table.bounds.depth = conf.table.depth;
  }

	private startGameLoop() {
		this.gameInterval = setInterval(() => {
			// Game state update logic (ball movement, collision, etc.)
			const state = {
		//		timestamp: Date.now(),
		//		ball: { x: Math.random(), y: Math.random() }, // stub
		//		players: this.players.map(p => ({ id: p.id }))
			};

			for (const player of this.game.players) {
				try {
					if (player.socket && typeof player.socket.send === 'function') {
						player.socket.send(JSON.stringify({ type: 'update', data: state }));
					}
				} catch (err) {
					console.error('Error sending to player socket:', err);
				}
			}
		}, 1000 / 30); // 30 FPS
	}
}
