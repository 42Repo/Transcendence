import { StateGame } from './StateGame';

export const DefaultState : StateGame = {
  table: {
    bounds: { width: 8, depth: 4 },
  },
  ball: {
    posZ: 0,
    posY: 0,
    speed: 1,
    diameter: 0,
    dirZ: -1,
    dirY: 1,
    onWall: false,
  },
  paddles: [
    {
      id: "",
      playerName: "",
      posX: 0,
      posZ: 0,
      width: 0,
      speed: .1,
    },
    {
      id: "",
      playerName: "",
      posX: 0,
      posZ: 0,
      width: 0,
      speed: .1,
    }
  ],
  players: [
    {
      id: "",
      name: "",
      socket: null,
      score: 0,
      touchedBall: 0,
      missedBall: 0,
      touchedBallInRaw: 0,
      missedBallInRaw: 0,
      lastTouch: false,
    },
    {
      id: "",
      name: "",
      socket: null,
      score: 0,
      touchedBall: 0,
      missedBall: 0,
      touchedBallInRaw: 0,
      missedBallInRaw: 0,
      lastTouch: false,
    }
  ]
};
