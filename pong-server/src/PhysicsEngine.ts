import { StateGame, Ball, PlayerBase, Player, Paddle } from './StateGame';
import { PongConfig } from './PongConfig';

export class PhysicsEngine {
  private config: PongConfig;

  constructor(config: PongConfig) {
    this.config = config;
  }

  public update(game: StateGame): void {
    game.players.forEach((player) => {
      const paddle: Paddle | undefined = game.paddles.find((pad: Paddle) => {
        return player.id === pad.id
      });
      if (!paddle) return;
      this.movePaddle(player, paddle);
      this.checkPaddleCollision(game, paddle);
      //debug
      if (player.playerKeys?.get('KeyR')){
        game.ball.posX = 0;
        game.ball.posZ = 0;
      }
    });
    this.moveBall(game);
  }

  private checkPaddleCollision(game: StateGame, paddle: Paddle){
    const maxBound = game.table.bounds.depth * .5 - paddle.width * .5 - this.config.wall.thickness;
    paddle.posZ = Math.sign(paddle.posZ) * Math.min(Math.abs(paddle.posZ), maxBound);
  }

  private movePaddle(player: PlayerBase, paddle: Paddle): void {
    if (player.playerKeys?.get('KeyW'))
      paddle.posZ -= paddle.speed;
    if (player.playerKeys?.get('KeyS'))
      paddle.posZ += paddle.speed;
  }

  private moveBall(game: StateGame) {
    this.moveBallZ(game);

    const ball = game.ball;
    const radius = this.config.ball.diameter * .5;
    const bounds = game.table.bounds;
    const maxX = bounds.width / 2 - this.config.wall.thickness - this.config.paddle.depth - radius;
    let paddle;

    if (ball.dirX > 0)
      paddle = game.paddles[0];
    else
      paddle = game.paddles[1];

    ball.posX += ball.dirX * ball.speed;
    if (Math.abs(ball.posX) > maxX
      && Math.abs(ball.posZ - paddle.posZ) < paddle.width * .5){
      ball.dirX *= -1;
    }
    else if (Math.abs(ball.posX) - radius >= maxX){
      //paddle lost
      ball.posX = 0;
      ball.posZ = 0;
    }
  }

  private moveBallZ(game: StateGame) {
    const ball = game.ball;
    const bounds = game.table.bounds;
    const radius = this.config.ball.diameter / 2;
    const maxZ = bounds.depth / 2 - radius - this.config.wall.thickness;


    ball.posZ += ball.dirZ * ball.speed;
    if (ball.posZ > maxZ) {
      ball.posZ = maxZ - (ball.posZ - maxZ);
      ball.dirZ *= -1;
    } else if (ball.posZ < -maxZ) {
      ball.posZ = -maxZ + (ball.posZ + maxZ);
      ball.dirZ *= -1;
    }
  }

  // private handleCollisions(game: StateGame) {
  //   const ball = game.ball;
  //   const bounds = game.table.bounds;
  //   const radius = this.config.ball.diameter / 2;
  //   const maxZ = bounds.depth / 2 - radius;
  //   const maxY = bounds.width / 2 - radius;

  //   if (ball.posZ > maxZ) {
  //     ball.posZ = maxZ - (ball.posZ - maxZ);
  //     ball.onWall = true;
  //   } else if (ball.posZ < -maxZ) {
  //     ball.posZ = -maxZ + (ball.posZ + maxZ);
  //     ball.onWall = true;
  //   }

  // }

  public handlePlayerInput(
    player: PlayerBase,
    input: { key: string, type: boolean}
  ) {
    player.playerKeys?.set(input.key, input.type);
  }
}
