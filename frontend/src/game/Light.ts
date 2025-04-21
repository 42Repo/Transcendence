import { GameObject } from './GameObject.ts';
import { Game } from '../pongGame.ts';
import * as BABYLON from '@babylonjs/core';
import { HemisphericLight, Vector3 } from '@babylonjs/core';

export class Light extends GameObject {
  public light : BABYLON.Light;

  constructor (game : Game, name : string, pos : Vector3) {
    super(game);

    this.light = new HemisphericLight(name, pos, this.game.scene);
  }
}
