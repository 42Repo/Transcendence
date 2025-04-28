import * as BABYLON from '@babylonjs/core';
import { ArcRotateCamera, Vector3 } from '@babylonjs/core';
import { GameObject } from './GameObject.ts';
import { StateManager } from './StateManager.ts';

export interface CameraOptions {
  minRadius?: number;
  maxRadius?: number;
  minClipDistance?: number;
  wheelPrecision?: number;
}

export class Camera extends GameObject {
  public camera: BABYLON.ArcRotateCamera;

  constructor(
    game: StateManager,
    name: string,
    angles: { alpha: number; beta: number; radius: number },
    target: Vector3,
    options?: CameraOptions
  ) {
    super(game);

    const { alpha, beta, radius } = angles;

    this.camera = new ArcRotateCamera(
      name,
      alpha,
      beta,
      radius,
      target,
      this.game.currentScene
    );

    this.camera.attachControl(this.game.canvas, true);
    if (options && options.wheelPrecision)
      this.camera.wheelPrecision = options.wheelPrecision;
    if (options && options.minRadius)
      this.camera.lowerRadiusLimit = options.minRadius;
    if (options && options.maxRadius)
      this.camera.upperRadiusLimit = options.maxRadius;
    if (options && options.minClipDistance)
      this.camera.minZ = options.minClipDistance;
  }
}
