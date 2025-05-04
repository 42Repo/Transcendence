import { StateManager } from "./StateManager";
import * as GUI from '@babylonjs/gui/2D'
import { Camera } from "./Camera";
import { Light } from './Light.ts';
import { Skybox } from './Skybox.ts';
import { MyMeshWriter, WriterDef } from './MyMeshWriter.ts';
import { switchPage, loadCurrentPage } from '../switch-page.ts';
import { Vector3 } from "@babylonjs/core";


export class LoseScene {
  private _stateManager: StateManager;
  private _message: string | undefined = undefined;
  private _exitPromise!: (choice: boolean) => void;
  private _choicePromise: Promise<boolean>;

  constructor(game: StateManager, message?: string) {
    this._stateManager = game;
    this._message = message;
    this._choicePromise = new Promise((choice) => {
      return this._exitPromise = choice;
    })
  }

  public async init(): Promise<void> {

    console.log("lose page", this._stateManager.currentScene);
    new Skybox(
      this._stateManager,
      "/assets/img/forgotten_ruins/scene.gltf",
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
        text: 'You Lose',
        anchor: "center",
        'letter-height': 10,
        'letter-thickness': 2,
        color: "#4a1c4a",
        alpha: 0.9,
        position: {
          x: 0,
          y: -2,
          z: 0
        },
      }
    };
    const text = new MyMeshWriter(this._stateManager, text1);
    text.rotate("x", -Math.PI / 2);

    if (this._message !== undefined) {
      console.log('On LoseScene: ', this._message)
      const text2: WriterDef = {
        scale: 1,
        writer: {
          text: this._message,
          anchor: 'center',
          'letter-height': 5,
          'letter-thickness': 2,
          color: "#a00000",
          alpha: 1,
          position: {
            y: -7,
          }
        }
      }
      const text = new MyMeshWriter(this._stateManager, text2);
      text.rotate("x", -Math.PI / 2);
    }
    const gui = GUI.AdvancedDynamicTexture.CreateFullscreenUI(
      "interface",
      true,
      this._stateManager.currentScene
    );

    const grid = new GUI.Grid();
    grid.addColumnDefinition(0.5);
    grid.addColumnDefinition(0.5);
    grid.addRowDefinition(1);
    grid.height = "10%";
    grid.width = "60%";
    grid.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    grid.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    grid.top = "25%";

    gui.addControl(grid);

    const btnLeave = GUI.Button.CreateSimpleButton("btnLeave", "Leave");
    btnLeave.height = '80%';
    btnLeave.width = '45%';
    btnLeave.cornerRadius = 20;
    btnLeave.background = '#4a1c4a';
    btnLeave.color = '#a77dc5';

    btnLeave.onPointerEnterObservable.add(() => {
      btnLeave.color = '#4a1c4a';
      btnLeave.background = '#a77dc5';
      btnLeave.scaleY = 1.3;
      btnLeave.scaleX = 1.3;
    });
    btnLeave.onPointerOutObservable.add(() => {
      btnLeave.color = '#a77dc5';
      btnLeave.background = '#4a1c4a';
      btnLeave.scaleY = 1;
      btnLeave.scaleX = 1;
    });
    btnLeave.onPointerClickObservable.add(() => {
      this._exitPromise(true);
      switchPage('home');
    });
    grid.addControl(btnLeave, 0, 0);

    const btnRestart = GUI.Button.CreateSimpleButton("btnRestart", "Restart");
    btnRestart.height = '80%';
    btnRestart.width = '45%';
    btnRestart.cornerRadius = 20;
    btnRestart.background = '#4a1c4a';
    btnRestart.color = '#a77dc5';

    btnRestart.onPointerEnterObservable.add(() => {
      btnRestart.color = '#4a1c4a';
      btnRestart.background = '#a77dc5';
      btnRestart.scaleX = 1.3;
      btnRestart.scaleY = 1.3;
    });
    btnRestart.onPointerOutObservable.add(() => {
      btnRestart.color = '#a77dc5';
      btnRestart.background = '#4a1c4a';
      btnRestart.scaleY = 1;
      btnRestart.scaleX = 1;
    });
    btnRestart.onPointerClickObservable.add(() => {
      this._exitPromise(true);
      loadCurrentPage();
    });
    grid.addControl(btnRestart, 0, 1);
    return;
  }

  public awaitExit(): Promise<boolean> {
    return this._choicePromise;
  }
}
