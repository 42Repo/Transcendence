import * as BABYLON from '@babylonjs/core';
import { Vector3, Color3 } from '@babylonjs/core';
import "@babylonjs/loaders";
import { PongConfig } from './game/PongConfig.ts';
import { defaultConfig } from './game/DefaultConf.ts';
import { Ball } from './game/Ball.ts';
import { Paddle } from './game/Paddle.ts';
import { Table } from './game/Table.ts';
import { Camera } from './game/Camera.ts';
import { Light } from './game/Light.ts';
import { Skybox } from './game/Skybox.ts';
import { Wall } from './game/Wall.ts';
import { WebSocketManager } from './game/WebSocketManager.ts';

type GameState = {
  paddles: { id: string; posX: number; posZ: number }[],
  ball:    { posY: number; posZ: number }
};

export class Game {
  private _engine: BABYLON.Engine;
  private _conf: PongConfig;
  public scene!: BABYLON.Scene;
  public canvas: HTMLCanvasElement;
  private _floorY!: number;
  private _leftPaddle : Paddle;
  private _rightPaddle : Paddle;
  private _ball: Ball;

  constructor(container: HTMLElement | null, conf: PongConfig = defaultConfig) {
    if (!container) {
      throw new Error("Error: container not found!");
    }

    this._conf = conf;

    const { canvas: canvasConf } = this._conf;
    this.canvas = this.createCanvas(container, canvasConf);
    this._engine = new BABYLON.Engine(this.canvas, true);
  }

  async init(): Promise<void> {
    this.scene = new BABYLON.Scene(this._engine);

    const {
      table,
      paddle,
      ball,
      wall,
      skybox,
      camera,
      light,
    } = this._conf;

    await new Skybox(this, skybox.path, skybox.meshName);

    const tableColor = table.color
      ? new Color3(table.color.r, table.color.g, table.color.b)
      : undefined;

    new Table(
      this,
      "table",
      new Vector3(0, table.y, 0),
      tableColor
    );

    const targetCamera = camera.followOffset
      ? camera.followOffset
      : camera.targetOffset;

    new Camera(this, "Cam1", camera.angles, targetCamera);
    new Light(this, "light1", light.direction);
    this._ball = new Ball(this, "ball1", ball.initialPosition);

    Object.entries(wall.wallPositions).forEach(([name,{
      width,
      height,
      depth,
      position
    }]) => {
      const props: { color?: Color3; alpha?: number } = {};

      if (wall.color) {
        props.color = new Color3(wall.color.r, wall.color.g, wall.color.b);
      }

      if (wall.alpha !== undefined) {
        props.alpha = wall.alpha;
      }

      new Wall(this, name, position as BABYLON.Vector3, props);
    });

    const paddleColorRight = paddle.colors && paddle.colors.right
      ? new Color3(
        paddle.colors.right.r,
        paddle.colors.right.g,
        paddle.colors.right.b
      ) : undefined;

    this ._rightPaddle = new Paddle(
      this,
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
      this,
      "paddleLeft",
      paddle.positions.left,
      paddleColorLeft
    );

    this._engine.runRenderLoop(() => {
      this.scene.render();
    });

    return;
  }

  createCanvas(container: HTMLElement, conf: PongConfig["canvas"]): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = conf.width;
    canvas.height = conf.height;
    canvas.style.border = conf.border;
    canvas.style.borderRadius = conf.borderRadius;
    container.appendChild(canvas);
    return canvas;
  }

  public setFloorY(y: number): void {
    this._floorY = y;
    return;
  }

  public updateState(state : StateGame) {
    console.log("hihihihi", state.paddles[0].posZ);
    this._rightPaddle.updateDepth(state.paddles[0].posZ);
    this._leftPaddle.updateDepth(state.paddles[1].posZ);
  }
}

export const mainGame = () => {
	const container = document.getElementById("game-container");
	if (!container)
		return (console.log("Error: container not found!"));
	const  initGame = new WebSocketManager(container);
};

document.addEventListener('DOMContentLoaded', mainGame);
