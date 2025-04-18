let socket: WebSocket;

function initWebSocket(draw: (state: any) => void) {
	const isLocal = location.hostname === 'localhost';
	const socketProtocol = isLocal ? 'ws' : 'wss';
	//const socket = new WebSocket(`${socketProtocol}://${location.host}/ws`);
	const socket = new WebSocket(`${socketProtocol}://${isLocal ? 'localhost:4000' : location.host}/ws`);


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

const createCanvas = (container : HTMLElement | null) :HTMLCanvasElement | null => {
	const canvas = document.createElement('canvas');
	canvas.width = 500;
	canvas.height = 500;
	canvas.style.border = '0.2em solid purple';
	canvas.style.borderRadius = '10%';
	if (!canvas || !container)
		return (null);
	container.appendChild(canvas);
	return canvas;
};

export function mainGame() {
	console.log("pong start !!");
	const container = document.getElementById("game-container");
	if (!container)
		return (console.log("Error: creating canvas container"));
	const canvas = createCanvas(container);
	if (!canvas)
		return (console.log("Error: creating canvas"));
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
