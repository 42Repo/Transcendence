import { StateGame, Ball, PlayerBase, Paddle } from './StateGame';
import { PongConfig } from './PongConfig';

export class PhysicsEngine {
  private config: PongConfig;

  constructor(config: PongConfig) {
    this.config = config;
  }

  public update(game: StateGame): void {
    this.moveBall(game.ball);
    this.handleCollisions(game);
  }

  private moveBall(ball: Ball) {
    if (ball.onWall) {
      ball.dirZ *= -.9;
      ball.onWall = false;
    }
    if (ball.onSide) {
      ball.dirY *= -1.05;
      ball.onSide = false;
    }
    ball.posZ += ball.dirZ * ball.speed;
    ball.posY += ball.dirY * ball.speed;
  }

  private handleCollisions(game: StateGame) {
    const ball = game.ball;
    const bounds = game.table.bounds;
    const radius = this.config.ball.diameter / 2;
    const maxZ = bounds.depth / 2 - radius;
    const maxY = bounds.width / 2 - radius

    if (ball.posZ > maxZ) {
      ball.posZ = maxZ - (ball.posZ - maxZ);
      ball.onWall = true;
    } else if (ball.posZ < -maxZ) {
      ball.posZ = -maxZ + (ball.posZ + maxZ);
      ball.onWall = true;
    }
    if (ball.posY > maxY) {
      ball.posY = maxY - (ball.posY - maxY);
      ball.onSide = true;
    } else if (ball.posY < -maxY) {
      ball.posY = -maxY + (ball.posY + maxY);
      ball.onSide = true;
    }
  }

  public handlePlayerInput(
    game: StateGame,
    player: PlayerBase,
    input: { key: string, type: boolean}
  ) {
    player.playerKeys?.set(input.key, input.type);
    console.log(player.playerKeys);
  
  //   const paddle: Paddle | undefined = game.paddles.find((pad: Paddle) => {
  //     return player.id === pad.id
  //   });
  //   if (!paddle) return;
  //   switch (input.key) {
  //     case 'ArrowUp':
  //     case 'w':
  //     case 'KeyW':
  //       paddle.posZ -= paddle.speed;
  //       break;
  //     case 'ArrowDown':
  //     case 's':
  //     case 'KeyS':
  //       paddle.posZ += paddle.speed;
  //       break;
  //     default:
  //       return;
  //   }

  //   const maxBound = game.table.bounds.depth * .5 - paddle.width * .5;
  //   paddle.posZ = Math.sign(paddle.posZ) * Math.min(Math.abs(paddle.posZ), maxBound);
  }
}
