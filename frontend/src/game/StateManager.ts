import { Engine, Scene } from '@babylonjs/core'
import { Game, GameState } from './Game.ts'
import { PongConfig } from './PongConfig.ts';
import { defaultConfig } from './DefaultConf.ts';

enum State { WAIT = 0, START = 1, WIN = 2, LOSE = 3 };

export class StateManager {
  private _engine: Engine;
  private _canvas: HTMLCanvasElement;
  private state: State = State.WAIT;
  private _currentScene: Scene | null = null;
  private _game: Game;
  public conf: PongConfig;
  private _floorY!: number;

  constructor(container: HTMLElement) {
    this._canvas = this.createCanvas(container, defaultConfig['canvas']);
    this._engine = new Engine(this._canvas, true);
    this._engine.hideLoadingUI();
    this.conf = defaultConfig;
    this._engine.runRenderLoop(() => {
      if (this._currentScene) {
        this._currentScene.render();
      }
    });;
  }

  public changeState = async (state: State) => {
    if (this._currentScene) {
      this._currentScene.dispose();
    }
    switch (state) {
      case State.WAIT:
        //this.currentScene = await new WaitScene(this.engine, this.container);
        break;
      case State.START:
        this._engine.hideLoadingUI();
        this._currentScene = new Scene(this._engine, true);
        this._engine.hideLoadingUI();
        this._game = new Game(this, defaultConfig);
        await this._game.init();
        break;
      case State.WIN:
        break;
      case State.LOSE:
        break;
      default:
        break;
    }
    if (this.state !== undefined) {
      this.state = state;
    }
  }

  private createCanvas(container: HTMLElement, conf: PongConfig["canvas"]): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = conf.width;
    canvas.height = conf.height;
    canvas.style.border = conf.border;
    canvas.style.borderRadius = conf.borderRadius;
    container.appendChild(canvas);
    return canvas;
  }

  public updateStateGame(state: GameState) {
    if (this.state && this.state === State.START) {
      this._game.updateState(state);
    }
  }

  public get engine(): Engine {
    return this._engine;
  }

  public get currentScene(): Scene {
    return this._currentScene;
  }

  public get canvas(): HTMLCanvasElement {
    return this._canvas;
  }

  public set floorY(y: number) {
    this._floorY = y;
    console.log(this._floorY);
    return;
  }
}
