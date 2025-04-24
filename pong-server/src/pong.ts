import fastifyWebsocket, { type WebSocket } from '@fastify/websocket';
import { v4 as uuidv4 } from 'uuid';
import { StateGame, PlayerBase, Paddle } from './StateGame';
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

  constructor (player1 : PlayerBase , player2: PlayerBase) {
    this.init(player1, player2);
	  this.startGameLoop();
  } 


	removePlayer(player: PlayerBase) {

	}

	handlePlayerInput(player: PlayerBase, data: { key:string }) {
		// parse input (move left/right/up/down)
    const paddle : Paddle | undefined = this.getPaddles().find((pad : Paddle) => {
      return player.id === pad.id
    });
    console.log(paddle);
       if (!paddle) return;

    // Vitesse de déplacement (tu peux la stocker dans ton config)
    const speed = 0.1;

    // Selon la touche, on modifie posZ
    switch (data.key) {
      case 'ArrowUp':
      case 'w':
      case'KeyW':
        paddle.posZ += speed;
        break;
      case 'ArrowDown':
      case 's':
      case 'KeyS':
        paddle.posZ -= speed;
        break;
      default:
        return;
    }

    const maxBound = this.game.table.bounds.depth * .5 - paddle.width * .5;
    paddle.posZ = Math.sign(paddle.posZ) * Math.min(Math.abs(paddle.posZ), maxBound);
	}

  getPlayers() : StateGame['players'] {
    return this.game.players;
  }

  getPaddles() : StateGame['paddles'] {
    return this.game.paddles;
  }

  private init(player1: PlayerBase, player2: PlayerBase, conf: PongConfig = defaultConfig) {
    this.game.players[0].id = player1.id; 
    this.game.players[0].socket = player1.socket;
    this.game.players[0].name = player1.name;
    this.game.paddles[0].id = player1.id;
    this.game.paddles[0].playerName = player1.name;
	this.game.paddles[0].width = conf.paddle.width;
    this.game.players[1].id = player2.id; 
    this.game.players[1].socket = player2.socket;
    this.game.players[1].name = player2.name;
    this.game.paddles[1].id = player2.id;
    this.game.paddles[1].playerName = player2.name;
	this.game.paddles[1].width = conf.paddle.width;
    this.game.table.bounds.width = conf.table.width;
    this.game.table.bounds.depth = conf.table.depth;
  }

	private startGameLoop() {
		this.gameInterval = setInterval(() => {
			// Game state update logic (ball movement, collision, etc.)
			const state = {
        paddles : this.game.paddles,
        //		timestamp: Date.now(),
        //		ball: { x: Math.random(), y: Math.random() }, // stub
        //		players: this.players.map(p => ({ id: p.id }))
      };
      this.broadcast("update", state);
    }, 1000 / 30); // 30 FPS
  }

  private broadcast(type: string, data : any) {
    const players : StateGame['players']= this.getPlayers();
    for (const player of players) {
      if (player.socket){
         player.socket.send(JSON.stringify({type: `${type}`, data }))
      }
    }
  }
}
