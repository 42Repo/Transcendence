import { WebSocketManager } from './game/WebSocketManager.ts';

export const mainGame = () => {
  const container = document.getElementById("game-container");
  console.log(container);
  if (!container)
    return (console.log("Error: container not found!"));
  new WebSocketManager(container);
};

document.addEventListener('pongGameLoaded', mainGame);
