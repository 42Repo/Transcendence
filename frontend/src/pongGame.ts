import * as BABYLON from '@babylonjs/core';

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
	canvas.classList.add("self-auto");
	if (!canvas || !container)
		return (null);
	container.appendChild(canvas);
	return canvas;
};

class Game {
	private _engine : Engine;
	private _scene : Scene;
	private _canvas : HTMLCanvasElement;

	private _state : number = 0;

	constructor (container : HTMLElement | null) {
		this._canvas = createCanvas(container);
		if (!this._canvas) {
			throw new Error("Error: canvas creation !");
		}
		this._engine = new BABYLON.Engine(this._canvas, true);
		this._scene = new BABYLON.Scene(this._engine);
		const camera : ArcRotateCamera = new BABYLON.ArcRotateCamera("camera1",
				Math.PI / 2, Math.PI / 4, 10, BABYLON.Vector3.Zero(), this._scene);
		camera.attachControl(this._canvas, true);
		const light1: HemisphericLight = new BABYLON.HemisphericLight("light1",
				new BABYLON.Vector3(1, 1, 0), this._scene);
		const sphere: Mesh = BABYLON.MeshBuilder.CreateSphere("sphere",
				{ diameter: 1 }, this._scene);
		const leftPaddle = BABYLON.MeshBuilder.CreateBox("leftPaddle",
				{ width: 0.2, height: 1, depth: 0.2 }, this._scene);
		leftPaddle.position.x = -3.5; // Positioned to the left side
		leftPaddle.position.y = 0; // Center the paddle on the Y-axis
		leftPaddle.position.z = 0; // Center the paddle on the Z-axis

		// Right Paddle
		const rightPaddle = BABYLON.MeshBuilder.CreateBox("rightPaddle",
				{ width: 0.2, height: 1, depth: 0.2 }, this._scene);
		rightPaddle.position.x = 3.5; // Positioned to the right side
		rightPaddle.position.y = 0;
		rightPaddle.position.z = 0;

		// Ball
		const ball = BABYLON.MeshBuilder.CreateSphere("ball", { diameter: 0.2 }, this._scene);
		ball.position = new BABYLON.Vector3(0, 0.2, 0); // Place the ball in the center

		// Start the game loop and update the game elements
		this._engine.runRenderLoop(() => {
			this._scene.render();
		});
	}
}

export function mainGame() {
	console.log("pong start !!");
	const container = document.getElementById("game-container");
	if (!container)
		return (console.log("Error: creating canvas container"));
	new Game(container);
	initWebSocket(()=>{
		console.log("need function to update move");
	});
}

document.addEventListener('DOMContentLoaded', mainGame);
