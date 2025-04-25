import { WebSocketManager } from './game/WebSocketManager.ts';

export const mainGame = () => {
  const container = document.getElementById("game-container");
  if (!container)
    return (console.log("Error: container not found!"));
  new WebSocketManager(container);
};

document.addEventListener('DOMContentLoaded', mainGame);
