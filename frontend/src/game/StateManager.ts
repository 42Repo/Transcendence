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
    this._canvas = this.createCanvas(container);
    this._engine = new Engine(this._canvas, true);
    this.conf = defaultConfig;

    window.addEventListener("resize", this.handleResize);

    this._engine.runRenderLoop(() => {
      if (this._currentScene) {
        this._currentScene.render();
      }
    });;
  }

  public updateWaitingPlayers(players: string[]) {
    if (this.state === State.WAIT && this._waitRoom) {
      this._waitRoom.updatePlayerNames(players);
    }
  }

  public changeState = async (state: State, data?: any) => {
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
        this._game = new Game(this, defaultConfig, data.players);
        await this._game.init();
        break;
      case State.WIN:
        this._currentScene = new Scene(this._engine);
        this._winScene = new WinScene(this, data.message);
        await this._winScene.init();
        const exitWin = await this._winScene.awitExit();
        this.cleanup();
        return exitWin;
      case State.LOSE:
        this._currentScene = new Scene(this._engine);
        this._loseScene = new LoseScene(this, data.message);
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

  private createCanvas(container: HTMLElement): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    //canvas.classList.add("w-full", "h-full", "block", "touch-none");
    const updateCanvasSize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    
    updateCanvasSize();
    
    const resizeObserver = new ResizeObserver(updateCanvasSize);
    resizeObserver.observe(container);
    
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    
    container.appendChild(canvas);
    return canvas;
  }

  private handleResize = () => {
    if (this._engine) {
      this._engine.resize();
    }
  };

  public cleanup(): void {
    window.removeEventListener("resize", this.handleResize);
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
