import { InfoPlayer } from '../pongGame.ts';
import { StateManager, State } from './StateManager.ts';

export class WebSocketManager {
  private container: HTMLElement;
  private keyMap: Map<string, boolean>;
  private socket: WebSocket | null = null;
  private stateManager: StateManager;
  private player: InfoPlayer;
  private tournament: boolean;

  constructor(container: HTMLElement, player: InfoPlayer, tournament: boolean) {
    this.container = container;
    this.keyMap = new Map();
    this.player = player;
    this.tournament = tournament; 
    document.addEventListener('keydown', this.keypress);
    document.addEventListener('keyup', this.keyup);
    this.stateManager = new StateManager(container);
    document.addEventListener('pong:leaving', this.cleanup);
    document.addEventListener('playerReady', this.gamereadyToStart, { once: true });
    this.connectToServer();
  }

  private onOpen = async () => {
    console.log('✅ Connected to Pong Server');
    const joinType = this.tournament ? 'joinTournament' : 'join';
    this.socket?.send(JSON.stringify({
      type: joinType, data: {
        infoPlayer: { ...this.player }
      }
    }));
  };

  private onMessage = async (event: any) => {
    const msg = JSON.parse(event.data);
    const { type, data} = msg;
    switch (type) {
      case 'names':
        this.stateManager.updateWaitingPlayers(data);
        break;
      case 'wait':
        this.stateManager.changeState(State.WAIT);
        break;
      case 'start':
        this.stateManager.changeState(State.START, msg.data);
        break;
      case 'update':
        this.stateManager.updateStateGame(msg.data);
        break;
      case 'lose':
        const exitLose = await this.stateManager.changeState(State.LOSE, msg.data);
        if (exitLose !== undefined)
          this.handleEndGame(exitLose);
        break;
      case 'win':
        const exitWin = await this.stateManager.changeState(State.WIN, msg.data);
        if (exitWin !== undefined)
          this.handleEndGame(exitWin);
        break;
      default:
        break;
    }
  };

  private onClose = () => {
    console.log('❌ Disconnected from Pong Server');
  };

  private keypress = (event: any) => {
    if (this.socket && this.socket.readyState === WebSocket.OPEN && this.keyMap.get(event.code) != true)
      this.socket.send(JSON.stringify({ type: 'input', data: { type: true, key: event.code } }));
    this.keyMap.set(event.code, true);
  };

  private keyup = (event: any) => {
    if (this.socket && this.socket.readyState === WebSocket.OPEN && this.keyMap.get(event.code) != false)
      this.socket.send(JSON.stringify({ type: 'input', data: { type: false, key: event.code } }));
    this.keyMap.set(event.code, false);
  };

  private handleEndGame = (exit: boolean) => {
    if (exit) {
      this.socket?.send(JSON.stringify({ type: 'close' }));
    } else {
      this.stateManager = new StateManager(this.container);
      this.connectToServer();
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket?.send(JSON.stringify({
          type: 'join', data: {
            infoPlayer: { ...this.player }
          }
        }));
      }
    }
  };

  private connectToServer = async (): Promise<void> => {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.removeEventListener('open', this.onOpen);
      this.socket.removeEventListener('message', this.onMessage);
      this.socket.removeEventListener('close', this.onClose);
      this.socket.close(1000, 'Reconnecting');
      this.socket = null;
    }
    const isLocal = location.hostname === 'localhost';
    const socketProtocol = isLocal ? 'ws' : 'wss';
    const host = isLocal ? 'localhost:4000' : location.host;
    this.socket = new WebSocket(`${socketProtocol}://${host}/ws`);
    this.socket.addEventListener('open', this.onOpen);
    this.socket.addEventListener('message', this.onMessage);
    this.socket.addEventListener('close', this.onClose);
  };

  private gamereadyToStart = () => {
    console.log('ready player', this.player.name);
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'ready' }));
    }
  };

  public cleanup = () => {
    this.stateManager.cleanup();
    document.removeEventListener('keydown', this.keypress);
    document.removeEventListener('keyup', this.keyup);
    document.removeEventListener('pong:leaving', this.cleanup);
    document.removeEventListener('playerReady', this.gamereadyToStart);
    if (this.socket) {
      this.socket.removeEventListener('open', this.onOpen);
      this.socket.removeEventListener('message', this.onMessage);
      this.socket.removeEventListener('close', this.onClose);
      this.socket.close(1000, 'Navigating away');
      this.socket = null;
    }
  };
}
