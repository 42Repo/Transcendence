import * as BABYLON from '@babylonjs/core';
import { ArcRotateCamera, Vector3 } from '@babylonjs/core';
import { GameObject } from './GameObject.ts';
import { StateManager } from './StateManager.ts';

interface CameraOptions {
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

    const {
      minRadius = 3,
      maxRadius = 30,
      minClipDistance = 0.01,
      wheelPrecision = 10
    } = options || {};

    const { alpha, beta, radius } = angles;

    this.camera = new ArcRotateCamera(
      name,
      alpha,
      beta,
      radius,
      target,
      game.currentScene
    );

    this.camera.attachControl(this.game.canvas, true);
    this.camera.wheelPrecision = wheelPrecision;
    this.camera.lowerRadiusLimit = minRadius;
    this.camera.upperRadiusLimit = maxRadius;
    this.camera.minZ = minClipDistance;
  }
}
