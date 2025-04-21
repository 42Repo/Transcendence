import { GameObject } from './GameObject.ts';
import { Game } from '../pongGame.ts';
import { Vector3, MeshBuilder, Color3 } from '@babylonjs/core'

export class Ball extends GameObject {

  constructor (
    game : Game,
    name: string, pos : Vector3,
    color? : Color3
  ) {
    super(game);
    const { diameter } = this.game["_conf"].ball;

    this.mesh = MeshBuilder.CreateSphere(
      name,
      { diameter },
      this.scene
    );
    this.mesh.position = pos;

    if (color) {
      this.setColor(color);
    }
  }
}
