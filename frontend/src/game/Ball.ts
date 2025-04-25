import { GameObject } from './GameObject.ts';
import { StateManager } from './StateManager.ts';
import { Vector3, MeshBuilder, Color3 } from '@babylonjs/core'

export class Ball extends GameObject {

  constructor(
    game: StateManager,
    name: string, pos: Vector3,
    color?: Color3
  ) {
    super(game);
    const { diameter } = this.game["conf"].ball;

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
