import { type WebSocket } from '@fastify/websocket';

export interface TableBounds {
  width: number;
  depth: number;
}

export interface Ball {
  posZ: number;
  posX: number;
  speed: number;
  diameter: number;
  dirZ: number;
  dirX: number;
  onWall: boolean;
  onSide: boolean;
}

export interface Paddle {
  id: string;
  playerName: string;
  posX: number;
  posZ: number;
  width: number;
  speed: number;
}

export interface Time {
  dateStr: string;
  matchDate: Date;
  matchDuration: number;
}

export interface PlayerStats {
  score: number;
  touchedBall: number;
  missedBall: number;
  touchedBallInRow: number;
  missedBallInRow: number;
  lastTouch: boolean;
}

export interface PlayerBase {
  id: string;
  name: string;
  avatar: string;
  socket: WebSocket | null;
  playerKeys: Map<string, boolean> | null;
}

export type Player = PlayerBase & PlayerStats;

export interface StateGame {
  table: {
    bounds: TableBounds;
  };

  time: Time;

  ball: Ball;

  paddles: Paddle[];

  players: Player[];
}
