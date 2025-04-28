import { defaultConfig } from './DefaultConf';
import { StateGame } from './StateGame';

export function createInitialState(): StateGame {
  let angle = Math.random() * 2.*Math.PI - Math.PI;
  if (Math.abs(Math.abs(angle) - Math.PI/2.) < Math.PI/6.)
    angle += Math.PI/6 * Math.sign(Math.abs(angle) - Math.PI/2.) * Math.sign(angle);
  let ballX = Math.cos(angle);
  let ballZ = Math.sin(angle);

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
        posX: defaultConfig.paddle.positions.right.x,
        posZ: 0,
        width: defaultConfig.paddle.width,
        speed: .15
      },
      { id: '',
        playerName: '',
        posX: defaultConfig.paddle.positions.left.x,
        posZ: 0,
        width: defaultConfig.paddle.width,
        speed: .15
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

