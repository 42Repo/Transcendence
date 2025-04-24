import { type WebSocket } from '@fastify/websocket';
import { v4 as uuidv4 } from 'uuid';
import { defaultConfig } from './DefaultConf';
import { createInitialState } from './createInitialState';
import { PhysicsEngine }       from './PhysicsEngine';
import { StateGame, PlayerBase, Paddle, Ball } from './StateGame';

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
	private game: StateGame = createInitialState();
	private gameInterval: NodeJS.Timeout | null = null;
  private physicsEngine: PhysicsEngine;

  constructor (player1 : PlayerBase , player2: PlayerBase) {
    this.game = createInitialState();
    this.game.players[0].id = player1.id; 
    this.game.players[0].socket = player1.socket;
    this.game.players[0].name = player1.name;
    this.game.paddles[0].id = player1.id;
    this.game.paddles[0].playerName = player1.name;
    this.game.players[1].id = player2.id; 
    this.game.players[1].socket = player2.socket;
    this.game.players[1].name = player2.name;
    this.game.paddles[1].id = player2.id;
    this.game.paddles[1].playerName = player2.name;
    this.physicsEngine = new PhysicsEngine(defaultConfig);
	  this.startGameLoop();
  } 


	removePlayer(player: PlayerBase) {

	}

	public handlePlayerInput(player: PlayerBase, data: { key:string }) {
    this.physicsEngine.handlePlayerInput(this.game, player, data)
	}

  public getPlayers() : StateGame['players'] {
    return this.game.players;
  }

  public getPaddles() : StateGame['paddles'] {
    return this.game.paddles;
  }

  public startGame() : void {
    this.broadcast('start', null);
  }

	private startGameLoop() {
		this.gameInterval = setInterval(() => {
      this.physicsEngine.update(this.game);
			const state = {
        paddles : this.game.paddles,
        ball : this.game.ball,
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
