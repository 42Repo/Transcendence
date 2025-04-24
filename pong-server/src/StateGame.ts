import fastifyWebsocket, { type WebSocket } from '@fastify/websocket';

export interface TableBounds {
  width: number;
  depth: number;
}

export interface Ball {
  posZ: number;
  posY: number;
  speed: number;
  diameter: number;
  dirZ: number;
  dirY: number;
  onWall: boolean;
}

export interface Paddle {
  id: string;
  playerName: string;
  posX: number;
  posZ: number;
  width: number;
  speed: number;
}

 export interface PlayerStats {
  score: number;
  touchedBall: number;
  missedBall: number;
  touchedBallInRaw: number;
  missedBallInRaw: number;
  lastTouch: boolean;
}

export interface PlayerBase {
  id: string;
  name: string;
  socket: WebSocket | null;
}

export type Player = PlayerBase & PlayerStats;

export interface StateGame {
  table: {
    bounds: TableBounds;
  };

  ball: Ball;

  paddles: Paddle[];

  players: Player[];
}
