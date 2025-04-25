import { StateManager } from './StateManager.ts';

export class WebSocketManager {
  private socket: WebSocket;
  private stateManager: StateManager;

  constructor(container: HTMLElement) {
    const isLocal = location.hostname === 'localhost';
    const socketProtocol = isLocal ? 'ws' : 'wss';
    const host = isLocal ? 'localhost:4000' : location.host;
    this.socket = new WebSocket(`${socketProtocol}://${host}/ws`);

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

  private onMessage = async (event: any) => {
    const msg = JSON.parse(event.data);
    const { type } = msg;
    switch (type) {
      case 'wait':
        console.log('Wait for other player');
        break;
      case 'start':
        console.log('game ready');
        this.stateManager.changeState(1);
        break;
      case 'update':
        //console.log(msg.data);
        this.stateManager.updateStateGame(msg.data);
        break;
      default:
        break;
    }
  };

  private onClose = () => {
    console.log('❌ Disconnected from Pong Server');
  };

  private keypress = (event: any) => {
    this.socket.send(JSON.stringify({ type: 'input', data: {type: true, key: event.code } }));
  };

  private keyup = (event: any) => {
    this.socket.send(JSON.stringify({ type: 'input', data: {type: false, key: event.code } }));
  };
}
