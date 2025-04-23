import * as BABYLON from '@babylonjs/core';
import { Game } from '../pongGame.ts';
import { Color3, StandardMaterial } from '@babylonjs/core';

export class GameObject {

  protected game : Game;
  protected scene : BABYLON.Scene;
  public mesh! : BABYLON.Mesh;
  
  constructor (game : Game) {
    this.game = game;
    this.scene = game.scene;
  }

  setColor(color : Color3, alpha? : number) {
    const material = new StandardMaterial("material", this.scene);
    material.diffuseColor = color;
    if (typeof alpha === "number") {
      material.alpha = alpha;
    }
    if (this.mesh) {
      this.mesh.material = material;
    }
  }

  updateWidth(num : number) {
    this.mesh.position.x = num;
  }

  updateHeight(num : number) {
    this.mesh.position.y = num;
  }

  updateDepth(num : number) {
    this.mesh.position.z = num;
  }
}
