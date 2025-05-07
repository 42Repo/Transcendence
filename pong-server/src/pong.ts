import { type WebSocket } from '@fastify/websocket';
import { v4 as uuidv4 } from 'uuid';
import { defaultConfig } from './DefaultConf';
import { createInitialState } from './createInitialState';
import { PhysicsEngine } from './PhysicsEngine';
import { StateGame, PlayerBase } from './StateGame';
import { StateEngine } from './StateEngine';

type MadeMatch = {
  player: PlayerBase;
  game: GameManager | null;
};

export class MatchMaking {
  private waitingPlayers: Map<string, PlayerBase>;
  private gameManagers: GameManager[];

  constructor(gameManagers: GameManager[]) {
    this.waitingPlayers = new Map();
    this.gameManagers = gameManagers;
  }

  addPlayer(
    socket: WebSocket,
    infoPlayer: { name: string, id: number | null, avatar: string },
    playerKeys: Map<string, boolean> | null
  ): MadeMatch {

    const idPlayer = infoPlayer.id !== null
      ? infoPlayer.id.toString()
      : uuidv4();
    const existPlayer = this.waitingPlayers.get(idPlayer);
    if (existPlayer)
      return { player: existPlayer, game: null };
    const player: PlayerBase = {
      id: idPlayer,
      socket,
      name: infoPlayer.name,
      avatar: infoPlayer.avatar,
      playerKeys
    };
    if (Array.from(this.waitingPlayers.values()).some((p) => {
      return p.socket === socket;
    }))
      return { player, game: null };
    this.waitingPlayers.set(idPlayer, player);
    if (this.waitingPlayers.size >= 2) {
      const [p1, p2] = Array.from(
        this.waitingPlayers.values()
      ).slice(0, 2);
      const newGame = new GameManager(p1, p2);
      this.gameManagers.push(newGame);
      this.waitingPlayers.delete(p1.id);
      this.waitingPlayers.delete(p2.id);
      return { player, game: newGame };
    }
    return { player, game: null };
  }

  public removePlayer(id: string) {
    const player = this.waitingPlayers.get(id);
    if (player) {
      this.waitingPlayers.delete(id);
    }
  }
}

export class GameManager {
  private game: StateGame = createInitialState();
  private gameInterval: NodeJS.Timeout | null = null;
  private physicsEngine: PhysicsEngine;
  private statesEngine: StateEngine;

  constructor(player1: PlayerBase, player2: PlayerBase) {
    this.game.players[0].id = player1.id;
    this.game.players[0].socket = player1.socket;
    this.game.players[0].name = player1.name;
    this.game.paddles[0].id = player1.id;
    this.game.paddles[0].playerName = player1.name;
    this.game.players[0].playerKeys = player1.playerKeys;
    this.game.players[0].avatar = player1.avatar;
    this.game.players[1].id = player2.id;
    this.game.players[1].socket = player2.socket;
    this.game.players[1].name = player2.name;
    this.game.paddles[1].id = player2.id;
    this.game.paddles[1].playerName = player2.name;
    this.game.players[1].playerKeys = player2.playerKeys;
    this.game.players[1].avatar = player2.avatar;
    this.statesEngine = new StateEngine(this, this.game);
    this.statesEngine.updateTime(true);
    this.physicsEngine = new PhysicsEngine(defaultConfig, this.statesEngine);
    this.startGameLoop();
  }


  removePlayer(player: PlayerBase) {
    this.gameOver();
    const remaining = this.game.players.find((p) => {
      return p.id !== player.id && p.socket;
    });
    if (remaining && remaining.socket) {
      remaining.socket.send(JSON.stringify({
        type: 'win',
        data: { message: `${player.name} left the game !` }
      }));
    }
    player.socket = null;
  }

  public handlePlayerInput(player: PlayerBase, data: { key: string, type: boolean }) {
    this.physicsEngine.handlePlayerInput(player, data)
  }

  public getPlayers(): StateGame['players'] {
    return this.game.players;
  }

  public getPaddles(): StateGame['paddles'] {
    return this.game.paddles;
  }

  public startGame(): void {
    this.broadcast('start', {
      players: {
        player1: this.createDataPlayer(this.game.players[0]),
        player2: this.createDataPlayer(this.game.players[1]),
      }
    });
  }

  public gameOver(): void {
    clearInterval(this.gameInterval!);
    this.gameInterval = null;
  }

  private createDataPlayer(player: PlayerBase): {
    name: string,
    id: string,
    avatar: string
  } {
    return {
      name: player.name,
      id: player.id,
      avatar: player.avatar
    };
  }

  private startGameLoop() {
    this.gameInterval = setInterval(() => {
      this.physicsEngine.update(this.game);
      this.statesEngine.updateTime(false);
      const state = {
        paddles: this.game.paddles,
        ball: this.game.ball,
        players: this.game.players.map(p => ({ score: p.score })),
        time: this.statesEngine.getElapsedTime(),
      };
      this.broadcast("update", state);
    }, 1000 / 30); // 30 FPS
  }

  private broadcast(type: string, data: any) {
    const players: StateGame['players'] = this.getPlayers();
    for (const player of players) {
      if (player.socket) {
        player.socket.send(JSON.stringify({ type: `${type}`, data }))
      }
    }
  }
}
