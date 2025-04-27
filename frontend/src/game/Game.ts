import * as BABYLON from '@babylonjs/core';
import { Vector3, Color3, Scene } from '@babylonjs/core';
import "@babylonjs/loaders";
import { PongConfig } from './PongConfig.ts';
import { Ball } from './Ball.ts';
import { Paddle } from './Paddle.ts';
import { Table } from './Table.ts';
import { Camera } from './Camera.ts';
import { Light } from './Light.ts';
import { Skybox } from './Skybox.ts';
import { Wall } from './Wall.ts';
import { StateManager } from './StateManager.ts';

export type GameState = {
  paddles: {
    id: string;
    playerName: string;
    posX: number;
    posZ: number;
    width: number;
    speed: number;
  }[],
  ball: {
    posZ: number;
    posX: number;
    speed: number;
    diameter: number;
    dirZ: number;
    dirX: number;
    onWall: boolean;
    onSide: boolean;
  }
};

export class Game {
  private _conf: PongConfig;
  public scene!: Scene;
  public canvas: HTMLCanvasElement;
  private _leftPaddle: Paddle | null = null;
  private _rightPaddle: Paddle | null = null;
  private _ball: Ball | null = null;
  private _stateManager: StateManager;

  constructor(stateManager: StateManager, conf: PongConfig) {
    this._conf = conf;
    this._stateManager = stateManager
    this.canvas = stateManager.canvas;
    this._engine = stateManager.engine;
    this.scene = this._stateManager.currentScene;
  }

  async init(): Promise<void> {
    const {
      table,
      paddle,
      ball,
      wall,
      skybox,
      camera,
      light,
    } = this._conf;

    new Skybox(this._stateManager, skybox.path, skybox.meshName);

    const tableColor = table.color
      ? new Color3(table.color.r, table.color.g, table.color.b)
      : undefined;

    new Table(
      this._stateManager,
      "table",
      new Vector3(0, table.y, 0),
      tableColor
    );

    const targetCamera = camera.followOffset
      ? camera.followOffset
      : camera.targetOffset;

    new Camera(this._stateManager, "Cam1", camera.angles, targetCamera);
    new Light(this._stateManager, "light1", light.direction);
    this._ball = new Ball(this._stateManager, "ball1", ball.initialPosition);

    Object.entries(wall.wallPositions).forEach(([name, { position }]) => {
      const props: { color?: Color3; alpha?: number } = {};

      if (wall.color) {
        props.color = new Color3(wall.color.r, wall.color.g, wall.color.b);
      }

      if (wall.alpha !== undefined) {
        props.alpha = wall.alpha;
      }

      new Wall(
        this._stateManager,
        name as 'left' | 'right' | 'front' | 'back',
        position as BABYLON.Vector3, props
      );
    });

    const paddleColorRight = paddle.colors && paddle.colors.right
      ? new Color3(
        paddle.colors.right.r,
        paddle.colors.right.g,
        paddle.colors.right.b
      ) : undefined;

    this._rightPaddle = new Paddle(
      this._stateManager,
      "paddleRight",
      paddle.positions.right,
      paddleColorRight
    );

    const paddleColorLeft = paddle.colors && paddle.colors.left
      ? new Color3(
        paddle.colors.left.r,
        paddle.colors.left.g,
        paddle.colors.left.b
      ) : undefined;

    this._leftPaddle = new Paddle(
      this._stateManager,
      "paddleLeft",
      paddle.positions.left,
      paddleColorLeft
    );
    return;
  }

  public updateState(state: GameState) {
    this._rightPaddle?.updateZ(state.paddles[0].posZ);
    this._leftPaddle?.updateZ(state.paddles[1].posZ);
    this._ball?.updateZ(state.ball.posZ);
    this._ball?.updateX(state.ball.posX);
  }
}
