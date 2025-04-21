import * as BABYLON from '@babylonjs/core';
import { ArcRotateCamera, Vector3 } from '@babylonjs/core';
import { GameObject } from './GameObject.ts';
import { Game } from '../pongGame.ts';

export class Camera extends GameObject {
  public camera : BABYLON.Camera;

  constructor (
    game : Game,
    name : string,
    angles : { alpha : number, beta : number, radius : number },
    target : Vector3
  ) {
    super(game);
    
    const { alpha, beta, radius } = angles;
    this.camera = new ArcRotateCamera(name, alpha, beta, radius, target);
    this.camera.attachControl(this.game.canvas, true);
  }
}
