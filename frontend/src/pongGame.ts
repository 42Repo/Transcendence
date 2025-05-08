import { WebSocketManager } from './game/WebSocketManager.ts';

export type InfoPlayer = {
  name: string;
  id: number | null;
  avatar: string;
}

let currentWSManager: WebSocketManager | null = null;

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

const onSubmit = async (event: Event, container: HTMLElement, player: InfoPlayer, form: HTMLFormElement) => {
  event.preventDefault();
  const modal = document.getElementById("modal-pong");
  if (!modal) {
    form.removeEventListener("submit", (event) => onSubmit(event, container, player, form));
    return;
  }
  const alias: string = (document.getElementById("alias") as HTMLInputElement).value;
  if (!alias) {
    form.removeEventListener("submit", (event) => onSubmit(event, container, player, form));
    return;
  }
  player.name = alias;
  modal.classList.add("hidden");

  form.removeEventListener("submit", (event) => onSubmit(event, container, player, form));
  if (!currentWSManager) {
    currentWSManager = new WebSocketManager(container, player);
  }
}

export const mainGame = async () => {
  if (currentWSManager) {
    return;
  }
  const container = document.getElementById("game-container");
  if (!container)
    return (console.log("Error: container not found!"));
  try {
    const player = await fetchUser();
    if (player.name === 'Unknown') {
      const modal = document.getElementById("modal-pong");
      if (modal) {
        modal.classList.remove("hidden");
        const form = document.getElementById("alias-form") as HTMLFormElement;
        if (form)
          form.addEventListener('submit', (e) => onSubmit(e, container, player, form));
      } else {
        currentWSManager = new WebSocketManager(container, player);
      }
    } else {
      currentWSManager = new WebSocketManager(container, player);
    }
  } catch (error) {
    console.log(error);
  }
};

const cleanupGame = () => {
  if (currentWSManager) {
    currentWSManager = null;
  }
};

const removeAllEventListeners = () => {
  document.removeEventListener('pongGameLoaded', mainGame);
  document.removeEventListener('pong:leaving', cleanupGame);
};

const setupEventListeners = () => {
  removeAllEventListeners();

  document.addEventListener('pongGameLoaded', mainGame);
  document.addEventListener('pong:leaving', cleanupGame);
};

setupEventListeners();
