import { GameObject } from './GameObject.ts';
import { Game } from '../pongGame.ts';
import { AppendSceneAsync } from '@babylonjs/core';
import "@babylonjs/loaders";

export class Skybox extends GameObject {
  private meshName : string;

  constructor (game : Game, path : string, meshName : string) {
    super(game);
    this.meshName = meshName;
    this.init(path);
  }

  private async init (path : string) {
    await AppendSceneAsync(path, this.scene);
    const meshBox = this.game.scene.getMeshByName(this.meshName);
    if (meshBox) {
      this.game.setFloorY(meshBox.getBoundingInfo().boundingBox.minimumWorld.y);
    }
  }
}
