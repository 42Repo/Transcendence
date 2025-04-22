import fastifyWebsocket, { type WebSocket } from '@fastify/websocket';

interface TableBounds {
  width: number;
  depth: number;
}

interface Ball {
  posZ: number;
  posY: number;
  speed: number;
}

interface Paddle {
  id: string;
  playerName: string;
  posX: number;
  posZ: number;
}

 interface PlayerStats {
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

type Player = PlayerBase & PlayerStats;

export interface StateGame {
  table: {
    bounds: TableBounds;
  };

  ball: Ball;

  paddle: Paddle[];

  players: Player[];
}
