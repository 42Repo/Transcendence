import { Vector3 } from '@babylonjs/core';
import { StateManager } from './StateManager.ts';
import { Camera } from './Camera.ts';
import { Light } from './Light.ts';
import { Skybox } from './Skybox.ts';
import { MyMeshWriter, WriterDef } from './MyMeshWriter.ts';

export class WaitGame {
  private _stateManager: StateManager;
  private _playerNames: MyMeshWriter | null = null;
  

  constructor(game: StateManager) {
    this._stateManager = game;
  }

  public updatePlayerNames(players: string[]) {
    // Clear existing names if they exist
    //this._playerNames?.dispose();

    // Create new names display
    const namesText = players.map(p => p).join('\n');
    
    const namesDef: WriterDef = {
      scale: 0.5,
      writer: {
        text: `Waiting players:\n${namesText}`,
        anchor: "center",
        'letter-height': 4,
        'letter-thickness': 1,
        color: "#FFFFFF",
        alpha: 0.8,
        position: {
          x: 0,
          y: -10,  // Adjust position as needed
          z: 0
        },
      }
    };
    
    this._playerNames = new MyMeshWriter(this._stateManager, namesDef);
    this._playerNames.rotate("x", -Math.PI / 2);
  }

  public async init(): Promise<void> {
    new Skybox(
      this._stateManager,
      "/assets/img/winter_night/scene.gltf",
      "Sphere__0"
    );

    new Camera(
      this._stateManager, "cam",
      { alpha: -Math.PI / 2, beta: Math.PI / 2, radius: 60 },
      new Vector3(0, -1.7, -9)
    );

    new Light(
      this._stateManager,
      "Light",
      new Vector3(0, 10, 0)
    );

    const text1: WriterDef = {
      scale: 1,
      writer: {
        text: 'Waiting Room',
        anchor: "center",
        'letter-height': 8,
        'letter-thickness': 2,
        color: "#E74E07",
        alpha: 0.8,
        position: {
          x: 0,
          y: -2,
          z: 0
        },
      }
    };
    const text = new MyMeshWriter(this._stateManager, text1);
    text.rotate("x", -Math.PI / 2);
    return;
  }
}
