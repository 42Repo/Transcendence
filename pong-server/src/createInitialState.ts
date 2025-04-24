import { defaultConfig } from './DefaultConf';
import { StateGame } from './StateGame';

export function createInitialState(): StateGame {
  return {
    table: {
      bounds: {
        width:  defaultConfig.table.width,
        depth:  defaultConfig.table.depth,
      }
    },
    ball: {
      posZ:     defaultConfig.ball.initialPosition.z,
      posY:     defaultConfig.ball.initialPosition.y,
      speed:    .1,
      diameter: defaultConfig.ball.diameter,
      dirZ:    -1,
      dirY:     1,
      onWall:   false,
    },
    paddles: [
      {
        id: '',
        playerName: '',
        posX: 0, posZ: 0,
        width: defaultConfig.paddle.width,
        speed: .1
      },
      { id: '',
        playerName: '',
        posX: 0,
        posZ: 0,
        width: defaultConfig.paddle.width,
        speed:.1
      }
    ],
    players: [
      {
        id: '',
        name: '',
        socket: null,
        score: 0,
        touchedBall: 0,
        missedBall: 0,
        touchedBallInRaw: 0,
        missedBallInRaw: 0,
        lastTouch: false
      },
      {
        id: '',
        name: '',
        socket: null,
        score: 0,
        touchedBall: 0,
        missedBall: 0,
        touchedBallInRaw: 0,
        missedBallInRaw: 0,
        lastTouch: false
      }
    ]
  };
}

