import { GameObject } from './GameObject.ts';
import { StateManager } from './StateManager.ts';
import { AppendSceneAsync } from '@babylonjs/core';
import "@babylonjs/loaders";

export class Skybox extends GameObject {
  private meshName: string;

  constructor(game: StateManager, path: string, meshName: string) {
    super(game);
    this.meshName = meshName;
    this.init(path);
  }

  private async init(path: string) {
    await AppendSceneAsync(path, this.scene);
    const meshBox = this.game.currentScene.getMeshByName(this.meshName);
    if (meshBox) {
      this.game.floorY = meshBox.getBoundingInfo().boundingBox.minimumWorld.y;
    }
  }
}
