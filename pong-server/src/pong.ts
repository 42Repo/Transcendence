import { WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';

type Player = {
  id: string;
  socket: WebSocket;
};

export class GameManager {
  private players: Player[] = [];
  private gameInterval: NodeJS.Timeout | null = null;

  addPlayer(socket: WebSocket): string {
	  console.log("Socket", socket);
    const id = uuidv4();
    this.players.push({ id, socket });
    if (!this.gameInterval) this.startGameLoop();
    return id;
  }

  removePlayer(id: string) {
    this.players = this.players.filter(p => p.id !== id);
    if (this.players.length === 0 && this.gameInterval) {
      clearInterval(this.gameInterval);
      this.gameInterval = null;
    }
  }

  handlePlayerInput(id: string, input: string) {
    // parse input (move left/right/up/down)
    console.log(`Player ${id} input:`, input);
  }

  private startGameLoop() {
    this.gameInterval = setInterval(() => {
      // Game state update logic (ball movement, collision, etc.)
      const state = {
        timestamp: Date.now(),
        ball: { x: Math.random(), y: Math.random() }, // stub
        players: this.players.map(p => ({ id: p.id }))
      };

	  for (const player of this.players) {
		  try {
			  if (player.socket && typeof player.socket.send === 'function') {
				  player.socket.send(JSON.stringify({ type: 'update', data: state }));
			  }
		  } catch (err) {
			  console.error('Error sending to player socket:', err);
		  }
	  }
    }, 1000 / 30); // 30 FPS
  }
}
