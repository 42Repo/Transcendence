import { StateGame, Ball, PlayerBase, Paddle } from './StateGame';
import { PongConfig } from './PongConfig';
import { StateEngine } from './StateEngine';

export class PhysicsEngine {
  private config: PongConfig;
  private states: StateEngine;

  constructor(config: PongConfig, states: StateEngine) {
    this.config = config;
    this.states = states;
  }

  public update(game: StateGame): void {
    game.players.forEach((player) => {
      const paddle: Paddle | undefined = game.paddles.find((pad: Paddle) => {
        return player.id === pad.id
      });
      if (!paddle) return;
      //debug
      if (player.playerKeys?.get('ShiftLeft')) {
        if (player.id == game.players[1].id)
          this.movePaddle(player, game.paddles[0]);
        else
          this.movePaddle(player, game.paddles[1]);
        return;
      }
      //
      this.movePaddle(player, paddle);
      this.checkPaddleCollision(game, paddle);
      //debug
      if (player.playerKeys?.get('KeyR')) {
        game.ball.posX = 0;
        game.ball.posZ = 0;
        game.ball.dirX = 1.;
        game.ball.dirZ = 0;
        game.ball.speed = .1;
      }
      //
    });
    this.moveBall(game);
  }

  private checkPaddleCollision(game: StateGame, paddle: Paddle) {
    const maxBound = game.table.bounds.depth * .5 - paddle.width * .5 - this.config.wall.thickness;
    paddle.posZ = Math.sign(paddle.posZ) * Math.min(Math.abs(paddle.posZ), maxBound);
  }

  private movePaddle(player: PlayerBase, paddle: Paddle): void {
    if (player.playerKeys?.get('KeyW'))
      paddle.posZ -= paddle.speed;
    if (player.playerKeys?.get('KeyS'))
      paddle.posZ += paddle.speed;
  }

  private checkBallCollision(ball: Ball, paddle: Paddle): boolean {
    let xPos = paddle.posX - this.config.paddle.depth * .5 * Math.sign(paddle.posX);
    let zPos = Math.max(Math.min(ball.posZ, paddle.posZ + paddle.width * .5), paddle.posZ - paddle.width * .5);

    let dist = Math.sqrt((zPos - ball.posZ) * (zPos - ball.posZ) + (xPos - ball.posX) * (xPos - ball.posX));

    if (dist <= ball.diameter * .5)
      return true;
    return false;
  }

  private moveBall(game: StateGame): void {
    this.moveBallZ(game);

    const ball = game.ball;
    const radius = this.config.ball.diameter * .5;
    const bounds = game.table.bounds;
    const maxX = bounds.width / 2 - this.config.wall.thickness - this.config.paddle.depth - radius;
    let paddle = (ball.dirX > 0) ? game.paddles[0] : game.paddles[1];

    ball.posX += ball.dirX * ball.speed;

    if (Math.abs(ball.posX) > maxX
      && this.checkBallCollision(ball, paddle)) {
      ball.posX = Math.sign(ball.posX) * (maxX - (Math.abs(ball.posX) - maxX));

      let angle = Math.PI / 4. + Math.PI / 4. * Math.sign(-ball.dirX) // start angle
        - Math.sign(ball.posZ - paddle.posZ) * Math.sign(ball.dirX) // which way to add angle
        * (Math.PI / 6. //min
          + Math.PI / 3. //variation
          * (Math.abs(ball.posZ - paddle.posZ) / (paddle.width * .5 + radius)));

      ball.dirZ = Math.cos(angle);
      ball.dirX = Math.sin(angle);
      console.log(angle, Math.cos(angle), Math.sin(angle))
      //ball.speed *= 1.05;
    }
    else if (Math.abs(ball.posX) - radius * 2. >= maxX) {
      //paddle lost
      ball.posX = 0;
      ball.posZ = 0;
    }
  }//TODO angles normaux, meilleures collisions sur les bords
  //TODO speed

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

  public handlePlayerInput(
    player: PlayerBase,
    input: { key: string, type: boolean }
  ) {
    player.playerKeys?.set(input.key, input.type);
  }
}
