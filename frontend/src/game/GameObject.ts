import * as BABYLON from '@babylonjs/core';
import { StateManager } from './StateManager.ts';
import { Vector3, Color3, StandardMaterial } from '@babylonjs/core';

export class GameObject {

  protected game: StateManager;
  protected scene: BABYLON.Scene;
  public mesh!: BABYLON.Mesh;

  constructor(game: StateManager) {
    this.game = game;
    this.scene = game.currentScene;
  }

  setColor(color: Color3, alpha?: number) {
    const material = new StandardMaterial("material", this.scene);
    material.diffuseColor = color;
    if (typeof alpha === "number") {
      material.alpha = alpha;
    }
    if (this.mesh) {
      this.mesh.material = material;
    }
  }

  updateX(num: number) {
    const x = this.mesh.position.x;

    if (Math.abs(x - num) > .001)
      this.mesh.translate(new Vector3(1, 0, 0), num - x, this.scene);
  }

  updateZ(num: number) {
    const z = this.mesh.position.z;

    if (Math.abs(z - num) > .001)
      this.mesh.translate(new Vector3(0, 0, 1), num - z, this.scene);
  }
  updateY(num: number) {
    const y = this.mesh.position.y;

    if (Math.abs(y - num) > .001)
      this.mesh.translate(new Vector3(0, 1, 0), num, this.scene);
  }
}
