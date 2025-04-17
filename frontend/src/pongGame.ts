let socket: WebSocket;

function initWebSocket(draw: (state: any) => void) {
	const isLocal = location.hostname === 'localhost';
	const socketProtocol = isLocal ? 'wss' : 'wss';
	const socket = new WebSocket(`${socketProtocol}://${location.host}/ws`);


  socket.onopen = () => {
    console.log('✅ Connected to Pong Server');
  };

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === 'update') {
      draw(message.data);
    }
  };

  socket.onclose = () => {
    console.log('❌ Disconnected from Pong Server');
  };
}

export function mainGame() {
	console.log("pong start !!");
  const canvas = document.createElement('canvas');
  canvas.width = 500;
  canvas.height = 500;
  canvas.style.border = '1px solid black';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d')!;

  const drawGame = (state: any) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw ball (example: coordinates normalized from 0-1)
    const ballX = state.ball?.x ?? 0.5;
    const ballY = state.ball?.y ?? 0.5;

    ctx.beginPath();
    ctx.fillStyle = 'red';
    ctx.arc(ballX * canvas.width, ballY * canvas.height, 10, 0, Math.PI * 2);
    ctx.fill();

    // You can also draw paddles and scores here later
  };

  initWebSocket(drawGame);
}

document.addEventListener('DOMContentLoaded', mainGame);
