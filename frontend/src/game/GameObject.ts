import * as BABYLON from '@babylonjs/core';
import { Game } from '../pongGame.ts';
import { Vector3, Color3, StandardMaterial } from '@babylonjs/core';

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

  updateX(num : number)
  {
    const x = this.mesh.position.x;

    console.log(x - num);
    if (Math.abs(x - num) > .01)//marge
      this.mesh.translate(new Vector3(1, 0, 0), (num - x) * .1, this.scene);
  }
//use deltatime ?
  updateZ(num:number)
  {
    const z = this.mesh.position.z;

    if (Math.abs(z - num) > .01)
      this.mesh.translate(new Vector3(0, 0, 1), (num - z) * .1, this.scene);
  }
  updateY(num:number)
  {
    this.mesh.translate(new Vector3(0, 1, 0), num, this.scene);
  }
}
