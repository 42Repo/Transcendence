import { GameObject } from './GameObject.ts';
import { StateManager } from './StateManager.ts';
import { Vector3, MeshBuilder, Color3 } from '@babylonjs/core'

export class Paddle extends GameObject {

  constructor(
    game: StateManager,
    name: string,
    pos: Vector3,
    color?: Color3
  ) {
    super(game);
    const { width, height, depth, rotation } = this.game["conf"].paddle;

    this.mesh = MeshBuilder.CreateBox(
      name,
      { width, height, depth },
      this.scene
    );

    this.mesh.position = pos;
    this.mesh.rotation = new Vector3(0, rotation, 0);

    if (color) {
      this.setColor(color);
    }
  }
}
