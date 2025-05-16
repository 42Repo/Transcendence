import * as BABYLON from '@babylonjs/core';
import { Vector3, Color3, Scene } from '@babylonjs/core';
import * as  GUI from '@babylonjs/gui/2D';
import "@babylonjs/loaders";
import { PongConfig } from './PongConfig.ts';
import { Ball } from './Ball.ts';
import { Paddle } from './Paddle.ts';
import { Table } from './Table.ts';
import { Camera } from './Camera.ts';
import { Light } from './Light.ts';
import { Skybox } from './Skybox.ts';
import { Wall } from './Wall.ts';
import { StateManager } from './StateManager.ts';

export type GameState = {
  paddles: {
    id: string;
    playerName: string;
    posX: number;
    posZ: number;
    width: number;
    speed: number;
  }[],
  ball: {
    posZ: number;
    posX: number;
    speed: number;
    diameter: number;
    dirZ: number;
    dirX: number;
    onWall: boolean;
    onSide: boolean;
  },
  players: {
    score: number;
  }[],
  time: number;
};

type Player = {
  name: string;
  id: string;
  avatar: string;
};

type Players = {
  player1: Player;
  player2: Player;
}
export class Game {
  private _conf: PongConfig;
  public scene!: Scene;
  public canvas: HTMLCanvasElement;
  private _players: Players;
  private _leftPaddle: Paddle | null = null;
  private _rightPaddle: Paddle | null = null;
  private _ball: Ball | null = null;
  private _stateManager: StateManager;
  private _scorePlayer1: GUI.TextBlock;
  private _scorePlayer2: GUI.TextBlock;
  private _elapseMin: GUI.TextBlock;
  private _elapseSec: GUI.TextBlock;
  private _isMobile : boolean;

  constructor(stateManager: StateManager, conf: PongConfig, data: Players) {
    this._conf = conf;
    this._stateManager = stateManager;
    this._players = data;

    this.canvas = stateManager.canvas;
    this.scene = stateManager.currentScene!;
    this._isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    this._scorePlayer1 = this.createTextBlock(
      "0",
      "Comic Sans MS, Chalkboard SE, Comic Neue, cursive, sans-serif",
      "60%"
    );
    this._scorePlayer2 = this.createTextBlock(
      "0",
      "Comic Sans MS, Chalkboard SE, Comic Neue, cursive, sans-serif",
      "60%"
    );
    this._elapseMin = this.createTextBlock(
      "00",
      "Comic Sans MS, Chalkboard SE, Comic Neue, cursive, sans-serif",
      "100%"
    );
    this._elapseSec = this.createTextBlock(
      "00",
      "Comic Sans MS, Chalkboard SE, Comic Neue, cursive, sans-serif",
      "100%"
    );
  }

  async init(): Promise<void> {
    const {
      table,
      paddle,
      ball,
      wall,
      skybox,
      camera,
      light,
    } = this._conf;

    new Skybox(this._stateManager, skybox.path, skybox.meshName);

    const tableColor = table.color
      ? new Color3(table.color.r, table.color.g, table.color.b)
      : undefined;

    new Table(
      this._stateManager,
      "table",
      new Vector3(0, table.y, 0),
      tableColor
    );

    const targetCamera = camera.followOffset
      ? camera.followOffset
      : camera.targetOffset;

    const cameraOptions = {
      minRadius: 3,
      maxRadius: 30,
      minClipDistance: 0.01,
      wheelPrecision: 10
    }

    new Camera(this._stateManager, "Cam1", camera.angles, targetCamera, cameraOptions);
    new Light(this._stateManager, "light1", light.direction);
    this._ball = new Ball(this._stateManager, "ball1", ball.initialPosition);

    Object.entries(wall.wallPositions).forEach(([name, { position }]) => {
      const props: { color?: Color3; alpha?: number } = {};

      if (wall.color) {
        props.color = new Color3(wall.color.r, wall.color.g, wall.color.b);
      }

      if (wall.alpha !== undefined) {
        props.alpha = wall.alpha;
      }

      new Wall(
        this._stateManager,
        name as 'left' | 'right' | 'front' | 'back',
        position as BABYLON.Vector3, props
      );
    });

    const paddleColorRight = paddle.colors && paddle.colors.right
      ? new Color3(
        paddle.colors.right.r,
        paddle.colors.right.g,
        paddle.colors.right.b
      ) : undefined;

    this._rightPaddle = new Paddle(
      this._stateManager,
      "paddleRight",
      paddle.positions.right,
      paddleColorRight
    );

    const paddleColorLeft = paddle.colors && paddle.colors.left
      ? new Color3(
        paddle.colors.left.r,
        paddle.colors.left.g,
        paddle.colors.left.b
      ) : undefined;

    this._leftPaddle = new Paddle(
      this._stateManager,
      "paddleLeft",
      paddle.positions.left,
      paddleColorLeft
    );

    const gui = GUI.AdvancedDynamicTexture.CreateFullscreenUI(
      "UI",
      true,
      this._stateManager.currentScene);
    const container = this.createContainer();
    const scoreGrid = this.createGrid();
    container.addControl(scoreGrid);
    gui.addControl(container);

    this.scene.onReadyObservable.add(() => {
      document.dispatchEvent(new Event('playerReady'));
    });

    if (this._isMobile) {
      this.createMobileControls();
    }

    return;
  }

  private createMobileControls(): void {
  const gui = GUI.AdvancedDynamicTexture.CreateFullscreenUI("MobileControls", true, this.scene);
  gui.layer!.layerMask = 2;

  const buttonSize = Math.min(this.canvas.width, this.canvas.height) * 0.25;

  const leftButton = this.createControlButton("KeyS", buttonSize);
  leftButton.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
  leftButton.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
  leftButton.left = "5%";
  leftButton.top = "-5%";

  const rightButton = this.createControlButton("KeyW", buttonSize);
  rightButton.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
  rightButton.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
  rightButton.left = "-5%";
  rightButton.top = "-5%";

  gui.addControl(leftButton);
  gui.addControl(rightButton);
}

private createControlButton(
  keyCode: string,
  size: number
): GUI.Button {
  const button = new GUI.Button();
  button.width = `${size}px`;
  button.height = `${size}px`;
  button.background = "rgba(116, 44, 116, 0.7)";
  button.color = "transparent";
  button.cornerRadius = size / 2;
  button.thickness = 0;
  button.zIndex = 100;

  const press = () => document.dispatchEvent(new KeyboardEvent('keydown', { code: keyCode }));
  const release = () => document.dispatchEvent(new KeyboardEvent('keyup', { code: keyCode }));

  button.onPointerDownObservable.add(press);
  button.onPointerUpObservable.add(release);
  button.onPointerOutObservable.add(release);

  return button;
}


  private createContainer(): GUI.Rectangle {
    const container = new GUI.Rectangle("GUIcontainer");
    container.width = "90%";
    container.height = "15%";
    container.background = "rgba(74, 28, 74, 0.5)";
    container.thickness = 2;
    container.color = "#a77dc5";
    container.cornerRadius = 10;
    container.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    container.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    container.top = "5%";
    return container;
  }

  private createGrid(): GUI.Grid {
    const scoreGrid = new GUI.Grid("scoreGrid");

    scoreGrid.addColumnDefinition(0.1);
    scoreGrid.addColumnDefinition(0.3);
    scoreGrid.addColumnDefinition(0.05);
    scoreGrid.addColumnDefinition(0.025);
    scoreGrid.addColumnDefinition(0.05);
    scoreGrid.addColumnDefinition(0.3);
    scoreGrid.addColumnDefinition(0.1);

    scoreGrid.addRowDefinition(0.8);
    scoreGrid.addRowDefinition(0.2);

    scoreGrid.width = "98%";
    scoreGrid.height = "85%";
    scoreGrid.top = "10%";
    scoreGrid.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    scoreGrid.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    const avatar1 = this.createAvatar("avatar1", this._players.player1.avatar);
    const avatar2 = this.createAvatar("avatar2", this._players.player2.avatar);
    scoreGrid.addControl(avatar1, 0, 0);
    scoreGrid.addControl(avatar2, 0, 6);
    const namePlayer1 = this.createTextBlock(
      this._players.player1.name,
      "Comic Sans MS, Chalkboard SE, Comic Neue, cursive, sans-serif",
      "50%",
    );
    const namePlayer2 = this.createTextBlock(
      this._players.player2.name,
      "Comic Sans MS, Chalkboard SE, Comic Neue, cursive, sans-serif",
      "50%",
    );
    scoreGrid.addControl(namePlayer1, 0, 1);
    scoreGrid.addControl(namePlayer2, 0, 5);
    scoreGrid.addControl(this._scorePlayer1, 0, 2);
    scoreGrid.addControl(this._scorePlayer2, 0, 4);
    const dotScore = this.createTextBlock(
      ":",
      "Comic Sans MS, Chalkboard SE, Comic Neue, cursive, sans-serif",
      "60%",
    );
    scoreGrid.addControl(dotScore, 0, 3);
    const dotTime = this.createTextBlock(
      ":",
      "Comic Sans MS, Chalkboard SE, Comic Neue, cursive, sans-serif",
      "100%",
    );
    scoreGrid.addControl(this._elapseMin, 1, 2);
    scoreGrid.addControl(this._elapseSec, 1, 4);
    scoreGrid.addControl(dotTime, 1, 3);
    return scoreGrid;
  }

  public createAvatar(id: string, path: string): GUI.Image {
    const img = new GUI.Image(id, path);
    img.stretch = GUI.Image.STRETCH_UNIFORM;
    img.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    img.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    return img;
  }

  public createTextBlock(
    name: string,
    font: string,
    size: number | string,
  ): GUI.TextBlock {
    const textBlock = new GUI.TextBlock();
    textBlock.text = name;
    textBlock.fontSize = size;
    textBlock.fontFamily = font;
    textBlock.color = '#e0c4f8';
    textBlock.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    textBlock.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    return textBlock;
  }

  public updateState(state: GameState) {
    this._rightPaddle?.updateZ(state.paddles[0].posZ);
    this._leftPaddle?.updateZ(state.paddles[1].posZ);
    this._ball?.updateZ(state.ball.posZ);
    this._ball?.updateX(state.ball.posX);
    this._scorePlayer1.text = state.players[0].score.toString();
    this._scorePlayer2.text = state.players[1].score.toString();
    this._elapseMin.text = Math.floor(state.time / 60).toString();
    this._elapseSec.text = (state.time - (Math.floor(state.time / 60) * 60)).toString();
  }
}
