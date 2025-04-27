import { defaultConfig } from './DefaultConf';
import { StateGame } from './StateGame';

export function createInitialState(): StateGame {
  let ballX = Math.random() * 2. - 1.;
  let ballZ = Math.random() * 2. - 1.;
  if (ballX == 0.)
    ballX = .5;
  let len = Math.sqrt(ballX * ballX + ballZ * ballZ);
  ballX /= len;
  ballZ /= len;

  return {
    table: {
      bounds: {
        width:  defaultConfig.table.width,
        depth:  defaultConfig.table.depth,
      }
    },
    ball: {
      posZ:     defaultConfig.ball.initialPosition.z,
      posX:     defaultConfig.ball.initialPosition.y,
      speed:    .1,
      diameter: defaultConfig.ball.diameter,
      dirZ:     ballZ,
      dirX:     ballX,
      onWall:   false,
      onSide:   false
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
        playerKeys : null,
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
        playerKeys : new Map(),
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

