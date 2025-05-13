import { StateGame, Ball, PlayerBase, Paddle } from './StateGame';
import { PongConfig } from './PongConfig';
import { StateEngine } from './StateEngine';

export class PhysicsEngine {
  private config: PongConfig;
  private states: StateEngine;
  private ballMoving: boolean;
  private ballCooldownUntil: number;

  constructor(config: PongConfig, states: StateEngine) {
    this.config = config;
    this.states = states;
    this.ballMoving = false;
    this.ballCooldownUntil = 0;
  }

  public startPhysics(){
    this.ballCooldownUntil = Date.now() + 1000;
  }

  public update(game: StateGame, tournament: boolean): void {
    game.players.forEach((player) => {
      const paddle: Paddle | undefined = game.paddles.find((pad: Paddle) => {
        return player.id === pad.id
      });
      if (!paddle) return;
      // //debug
      // if (player.playerKeys?.get('ShiftLeft')) {
      //   if (player.id == game.players[1].id)
      //     this.movePaddle(player, game.paddles[0]);
      //   else
      //     this.movePaddle(player, game.paddles[1]);
      //   return;
      // }
      // //
      this.movePaddle(player, paddle);
      this.checkPaddleCollision(game, paddle);
      // //debug
      // if (player.playerKeys?.get('KeyR')) {
      //   game.ball.posX = 0;
      //   game.ball.posZ = 0;
      //   game.ball.dirX = 1.;
      //   game.ball.dirZ = 0;
      //   game.ball.speed = .1;
      // }
      // //
    });
    if (this.ballCooldownUntil != 0 && Date.now() >= this.ballCooldownUntil)
      this.ballMoving = true;
    if (this.ballMoving)
      this.moveBall(game, tournament);
  }

  private launchBall(ball: Ball) {
    let angle = Math.random() * 2. * Math.PI - Math.PI;
    if (Math.abs(Math.abs(angle) - Math.PI / 2.) < Math.PI / 6.)
      angle += Math.PI / 6 * Math.sign(Math.abs(angle) - Math.PI / 2.) * Math.sign(angle);
    ball.dirX = Math.cos(angle);
    ball.dirZ = Math.sin(angle);
    ball.posX = 0;
    ball.posZ = 0;
    ball.speed = .1;
    this.ballCooldownUntil = Date.now() + 500;
    this.ballMoving = false;
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

  private moveBall(game: StateGame, tournament: boolean): void {
    this.moveBallZ(game);

    const ball = game.ball;
    const radius = this.config.ball.diameter * .5;
    const bounds = game.table.bounds;
    const maxX = bounds.width / 2 - this.config.wall.thickness - this.config.paddle.depth - radius;
    const paddle = (ball.dirX > 0) ? game.paddles[0] : game.paddles[1];

    ball.posX += ball.dirX * ball.speed;

    if (Math.abs(ball.posX) > maxX) {
      const xPos = paddle.posX - this.config.paddle.depth * .5 * Math.sign(paddle.posX);
      const zPos = Math.max(Math.min(ball.posZ, paddle.posZ + paddle.width * .5), paddle.posZ - paddle.width * .5);
      const dist = Math.sqrt(
        (zPos - ball.posZ) * (zPos - ball.posZ)
        + (xPos - ball.posX) * (xPos - ball.posX)
      );
      if (dist <= radius) {
        const hitter = game.players.find((p) => {
          return p.id === paddle.id;
        });
        if (hitter)
          this.states.updateTouchedBall(hitter);
        const angle = Math.PI / 2. + Math.PI / 2. * Math.sign(ball.dirX) // start angle
          - Math.sign(ball.posZ - paddle.posZ) * Math.sign(ball.dirX) // which way to add angle
          * (Math.PI / 3. //variation
            * (Math.abs(zPos - paddle.posZ) / (paddle.width * .5)));

        ball.dirX = Math.cos(angle);
        ball.dirZ = Math.sin(angle);
        if (Math.abs(paddle.posZ - ball.posZ) < paddle.width * .5)
          ball.posX = Math.sign(ball.posX) * (maxX - (Math.abs(ball.posX) - maxX));
        if (ball.speed < 3.)
          ball.speed *= 1.03;
      }
      else if (Math.abs(ball.posX) - radius * 2. >= maxX) {
        const scorer = (ball.dirX > 0) ? game.players[1] : game.players[0];
        this.states.updateScore(scorer, tournament);
        //paddle lost
        this.launchBall(ball);
      }
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

  public handlePlayerInput(
    player: PlayerBase,
    input: { key: string, type: boolean }
  ) {
    player.playerKeys?.set(input.key, input.type);
  }
}
