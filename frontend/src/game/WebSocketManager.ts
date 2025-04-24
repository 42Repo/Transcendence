import { Game } from '../pongGame.ts'

export class WebSocketManager {
  private socket : WebSocket;
  private htmlContainer : HTMLElement;
  private game : Game | null = null;

  constructor (container : HTMLElement) {
    const isLocal = location.hostname === 'localhost';
    const socketProtocol = isLocal ? 'ws' : 'wss';
    const host = isLocal ? 'localhost:4000' : location.host;
    this.socket = new WebSocket(`${socketProtocol}://${host}/ws`);
    this.htmlContainer = container;

    this.socket.addEventListener('open', this.onOpen);
    this.socket.addEventListener('message', this.onMessage);
    this.socket.addEventListener('close', this.onClose);
    document.addEventListener('keypress', this.keypress);

  }

  private onOpen = () => {
    console.log('✅ Connected to Pong Server');
    //fetch user if connected
    this.socket.send(JSON.stringify({type: 'join', data: {name:'Chris'}}));
  };

  private onMessage = async (event) => {
    const msg = JSON.parse(event.data);
    const { type } = msg;
    switch (type) {
      case 'wait':
        console.log('Wait for other player');
        break;
      case 'start':
        console.log('game ready');
        this.game = await new Game(this.htmlContainer);
        this.game.init();
        break;
      case 'update':
        console.log(msg.data);
        this.game.updateState(msg.data);
        break;
      default:
        break;
    }
  };

  private onClose = () => {
    console.log('❌ Disconnected from Pong Server');
  };

  private keypress = (event) => {
    this.socket.send(JSON.stringify({type:'input', data: {key: event.code}}));
    console.log('keypress: ',event.code);
  };
}
