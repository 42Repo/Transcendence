import { Engine, Scene } from '@babylonjs/core'
import { Game, GameState } from './Game.ts'
import { PongConfig } from './PongConfig.ts';
import { defaultConfig } from './DefaultConf.ts';
import { WaitGame } from './WaitGame.ts';
import { WinScene } from './WinScene.ts';
import { LoseScene } from './LoseScene.ts';

export enum State { WAIT = 0, START = 1, WIN = 2, LOSE = 3 };

export class StateManager {
  private _engine: Engine;
  private _canvas: HTMLCanvasElement;
  private state: State = State.WAIT;
  private _currentScene: Scene | null = null;
  private _game: Game | null = null;
  private _waitRoom: WaitGame | null = null;
  private _winScene: WinScene | null = null;
  private _loseScene: LoseScene | null = null;
  public conf: PongConfig;
  private _floorY!: number;

  constructor(container: HTMLElement) {
    this._canvas = this.createCanvas(container, defaultConfig['canvas']);
    this._engine = new Engine(this._canvas, true);
    this.conf = defaultConfig;
    this._engine.runRenderLoop(() => {
      if (this._currentScene) {
        this._currentScene.render();
      }
    });;
  }

  public changeState = async (state: State, message?: string) => {
    if (this._currentScene) {
      this._currentScene.dispose();
    }
    switch (state) {
      case State.WAIT:
        this._currentScene = new Scene(this._engine);
        this._waitRoom = new WaitGame(this);
        await this._waitRoom.init();
        break;
      case State.START:
        this._currentScene = new Scene(this._engine);
        this._game = new Game(this, defaultConfig);
        await this._game.init();
        break;
      case State.WIN:
        this._currentScene = new Scene(this._engine);
        this._winScene = new WinScene(this, message);
        await this._winScene.init();
        const exitWin = await this._winScene.awitExit();
        this.cleanup();
        return exitWin;
      case State.LOSE:
        this._currentScene = new Scene(this._engine);
        this._loseScene = new LoseScene(this, message);
        await this._loseScene.init();
        const exitLose = await this._loseScene.awaitExit();
        this.cleanup();
        return exitLose;
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

  private cleanup(): void {
    this._currentScene?.dispose();
    this._engine.dispose();
    this._canvas.remove();
  }

  public updateStateGame(state: GameState) {
    if (this._game && this.state && this.state === State.START) {
      this._game.updateState(state);
    }
  }

  public get engine(): Engine {
    return this._engine;
  }

  public get currentScene(): Scene | null {
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
