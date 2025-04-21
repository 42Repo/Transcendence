import { GameObject } from './GameObject.ts';
import { Game } from '../pongGame.ts';
import { Vector3, MeshBuilder, Color3 } from '@babylonjs/core'

export class Table extends GameObject {

  constructor (
    game : Game,
    name : string, pos : Vector3,
    color? : Color3) {
    super(game);
    const { width, height, depth } = this.game['_conf'].table;

    this.mesh = MeshBuilder.CreateBox(name,
      { width, height, depth },
      this.scene
    );

    this.mesh.position = pos;

    if (color) {
      this.setColor(color);
    }
  }
}
