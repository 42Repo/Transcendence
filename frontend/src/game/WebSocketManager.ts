import { StateManager, State } from './StateManager.ts';

interface Player {
  name: string;
  id: number | null;
}

export class WebSocketManager {
  private keyMap: Map<string, boolean>;
  private socket: WebSocket | null = null;
  private stateManager: StateManager;
  private player: Player = { name: 'UnKnown', id: null };

  constructor(container: HTMLElement) {

    this.keyMap = new Map();
    document.addEventListener('keydown', this.keypress);
    document.addEventListener('keyup', this.keyup);
    this.stateManager = new StateManager(container);
    this.connectToServer();
  }

  private onOpen = async () => {
    console.log('✅ Connected to Pong Server');
    this.socket?.send(JSON.stringify({
      type: 'join', data: {
        infoPlayer: {
          name: this.player.name,
          id: this.player.id
        }
      }
    }));
  };

  private onMessage = async (event: any) => {
    const msg = JSON.parse(event.data);
    const { type } = msg;
    switch (type) {
      case 'wait':
        this.stateManager.changeState(State.WAIT);
        break;
      case 'start':
        this.stateManager.changeState(State.START);
        break;
      case 'update':
        this.stateManager.updateStateGame(msg.data);
        break;
      case 'lose':
        const exitLose = await this.stateManager.changeState(State.LOSE, msg.data.message);
        if (exitLose !== undefined)
          this.handleEndGame(exitLose);
        break;
      case 'win':
        const exitWin = await this.stateManager.changeState(State.WIN, msg.data.message);
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
    if (this.socket && this.keyMap.get(event.code) != true)
      this.socket.send(JSON.stringify({ type: 'input', data: { type: true, key: event.code } }));
    this.keyMap.set(event.code, true);
  };

  private keyup = (event: any) => {
    if (this.socket && this.keyMap.get(event.code) != false)
      this.socket.send(JSON.stringify({ type: 'input', data: { type: false, key: event.code } }));
    this.keyMap.set(event.code, false);
  };

  private handleEndGame = (exit: boolean) => {
    if (exit) {
      this.socket?.send(JSON.stringify({ type: 'close' }));
    } else {
      console.log('restart');
      this.connectToServer();
      this.socket?.send(JSON.stringify({ type: 'join', data: { name: this.player.name } }));
    }
  };

  private connectToServer = async (): Promise<void> => {
    const isLocal = location.hostname === 'localhost';
    const socketProtocol = isLocal ? 'ws' : 'wss';
    const host = isLocal ? 'localhost:4000' : location.host;
    await this.fetchUser();
    if (this.socket) {
      this.socket.close();
    }
    this.socket = new WebSocket(`${socketProtocol}://${host}/ws`);
    this.socket.addEventListener('open', this.onOpen);
    this.socket.addEventListener('message', this.onMessage);
    this.socket.addEventListener('close', this.onClose);
  };

  private fetchUser = async (): Promise<void> => {
    const isLocal = location.hostname === 'localhost';
    const host = isLocal ? 'localhost:4000' : location.host;
    const token = localStorage.getItem('authToken');
    if (token === null)
      return;
    const safeToken = encodeURIComponent(token);
    const url = `http://${host}/user?token=${safeToken}`;
    try {
      const res = await fetch(url, { method: "GET" });
      if (!res.ok) {
        throw new Error(`Status ${res.status}\nError: fetch user data`);
      }
      const data = await res.json();
      this.player.name = data.name;
      this.player.id = data.id;
    } catch (err: any) {
      console.log(err.message);
    }
  }
}
