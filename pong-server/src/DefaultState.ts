import { StateGame } from './StateGame';

export const DefaultState : StateGame = {
  table: {
    bounds: { width: 8, depth: 4 },
  },
  ball: {
    posZ: 0,
    posY: 0,
    speed: 1,
  },
  paddles: [
    {
      id: "",
      playerName: "",
      posX: 0,
      posZ: 0,
    },
    {
      id: "",
      playerName: "",
      posX: 0,
      posZ: 0,
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
