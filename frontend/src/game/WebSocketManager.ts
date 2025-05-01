import { StateManager, State } from './StateManager.ts';

export class WebSocketManager {
  private keyMap: Map<string, boolean>;
  private socket: WebSocket;
  private stateManager: StateManager;

  constructor(container: HTMLElement) {
    const isLocal = location.hostname === 'localhost';
    const socketProtocol = isLocal ? 'ws' : 'wss';
    const host = isLocal ? 'localhost:4000' : location.host;
    this.socket = new WebSocket(`${socketProtocol}://${host}/ws`);

    this.keyMap = new Map();
    this.socket.addEventListener('open', this.onOpen);
    this.socket.addEventListener('message', this.onMessage);
    this.socket.addEventListener('close', this.onClose);
    document.addEventListener('keydown', this.keypress);
    document.addEventListener('keyup', this.keyup);
    this.stateManager = new StateManager(container);
  }

  private onOpen = () => {
    console.log('✅ Connected to Pong Server');
    //fetch user if connected
    this.socket.send(JSON.stringify({ type: 'join', data: { name: 'Chris' } }));
  };

  private onMessage = (event: any) => {
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
        this.stateManager.changeState(State.LOSE, msg.data.message);
        this.socket.send(JSON.stringify({ type: 'close' }));
        break;
      case 'win':
        this.stateManager.changeState(State.WIN, msg.data.message);
        this.socket.send(JSON.stringify({ type: 'close' }));
        break;
      default:
        break;
    }
  };

  private onClose = () => {
    console.log('❌ Disconnected from Pong Server');
  };

  private keypress = (event: any) => {
    if (this.keyMap.get(event.code) != true)
      this.socket.send(JSON.stringify({ type: 'input', data: { type: true, key: event.code } }));
    this.keyMap.set(event.code, true);
  };

  private keyup = (event: any) => {
    if (this.keyMap.get(event.code) != false)
      this.socket.send(JSON.stringify({ type: 'input', data: { type: false, key: event.code } }));
    this.keyMap.set(event.code, false);
  };
}
