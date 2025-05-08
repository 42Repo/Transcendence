import { WebSocketManager } from './game/WebSocketManager.ts';

export type InfoPlayer = {
  name: string;
  id: number | null;
  avatar: string;
}

const fetchUser = async (): Promise<InfoPlayer> => {
  const player: InfoPlayer = { name: 'Unknown', id: null, avatar: '/assets/img/defaultAvatar.jpg' };
  const isLocal = location.hostname === 'localhost';
  const host = isLocal ? 'localhost:4000' : location.host;
  const token = localStorage.getItem('authToken');
  if (token === null)
    return player;
  const safeToken = encodeURIComponent(token);
  const url = `http://${host}/user?token=${safeToken}`;
  try {
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) {
      throw new Error(`Status ${res.status}\nError: fetch user data`);
    }
    const data = await res.json();
    player.name = data.name;
    player.id = data.id;
  } catch (err: any) {
    console.log(err);
  }
  return player;
}

const onSubmit = async (event: Event, container: HTMLElement, player: InfoPlayer) => {
  event.preventDefault();
  const modal = document.getElementById("modal-pong");
  if (!modal) {
    return;
  }
  const alias: string = (document.getElementById("alias") as HTMLInputElement).value;
  if (!alias) {
    return;
  }
  player.name = alias;
  modal.classList.add("hidden");
  document.removeEventListener("submit", (event) => onSubmit(event, container, player));
  new WebSocketManager(container, player);
}

export const mainGame = async () => {
  const container = document.getElementById("game-container");
  if (!container)
    return (console.log("Error: container not found!"));
  try {
    const player = await fetchUser();
    if (player.name === 'Unknown') {
      const modal = document.getElementById("modal-pong");
      if (modal) {
        modal.classList.remove("hidden");
        document.addEventListener("submit", (event) => onSubmit(event, container, player));
      } else {
        new WebSocketManager(container, player);
      }
    }
  } catch (error) {
    console.log(error);
  }
};

document.addEventListener('pongGameLoaded', mainGame);
