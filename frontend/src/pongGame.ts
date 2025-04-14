const isGame = document.getElementById('game') as HTMLCanvasElement;

function mainGame() {
  // const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  const canvas = document.createElement('canvas');
  canvas.setAttribute('width', '500px');
  canvas.setAttribute('height', '500px');
  document.body.appendChild(canvas);
  // draw red square
  const ctx = canvas.getContext('2d')!;
  ctx.beginPath();
  ctx.fillStyle = 'rgba(255,0,0,1)';
  ctx.rect(10, 10, 50, 50);
  ctx.fill();
}
// document.addEventListener('DOMContentLoaded', () => {

// mainGame();
// });
