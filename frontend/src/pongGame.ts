import { WebSocketManager } from './game/WebSocketManager.ts';

import {
  fetchMyProfileData,
  UserPrivateData,
  UserPublicData,
} from './userService';
import { isAuthenticated } from './switch-page';

export type InfoPlayer = {
  name: string;
  id: number | null;
  avatar: string;
};

let currentWSManager: WebSocketManager | null = null;

// const fetchUser = async (): Promise<InfoPlayer> => {
//   const player: InfoPlayer = {
//     name: 'Unknown',
//     id: null,
//     avatar: '/assets/img/defaultAvatar.jpg',
//   };
//   const isLocal = location.hostname === 'localhost';
//   const host = isLocal ? 'localhost:4000' : location.host;
//   const token = localStorage.getItem('authToken');
//   if (token === null) return player;
//   const safeToken = encodeURIComponent(token);
//   const url = `http://${host}/api/user?token=${safeToken}`;
//   const url = `${location.protocol}//${location.host}/api/user/me?token=${safeToken}`;
//   try {
//     const res = await fetch(url, { method: 'GET' });
//     if (!res.ok) {
//       throw new Error(`Status ${res.status}\nError: fetch user data`);
//     }
//     const data = await res.json();
//     player.name = data.name;
//     player.id = data.id;
//   } catch (err: any) {
//     console.error(err);
//   }
//   return player;
// };

const onSubmit = async (
  event: Event,
  container: HTMLElement,
  player: InfoPlayer,
  form: HTMLFormElement,
  tournament: boolean
) => {
  event.preventDefault();
  const modal = document.getElementById('modal-pong');
  if (!modal) {
    form.removeEventListener('submit', (event) =>
      onSubmit(event, container, player, form, tournament)
    );
    return;
  }
  const alias: string = (document.getElementById('alias') as HTMLInputElement)
    .value;
  if (!alias || !alias.trim()) {
    form.removeEventListener('submit', (event) =>
      onSubmit(event, container, player, form, tournament)
    );
    return;
  }
  player.name = alias.trim();
  modal.classList.add('hidden');

  form.removeEventListener('submit', (event) =>
    onSubmit(event, container, player, form, tournament)
  );
  if (!currentWSManager) {
    currentWSManager = new WebSocketManager(container, player, tournament);
  }
};

export const mainGame = async (tournament?: boolean) => {
  if (currentWSManager) {
    return;
  }
  const container = document.getElementById('game-container');
  if (!container) return console.log('Error: container not found!');
  try {
    const isAuth = await isAuthenticated();
    let player: InfoPlayer;

    if (isAuth) {
      const userData: UserPrivateData | undefined = await fetchMyProfileData();
      if (userData) {
        player = {
          id: userData.user_id,
          name: userData.username,
          avatar: userData.avatar_url || '/DefaultProfilePic.png',
        };
      } else {
        console.warn(
          'Failed to fetch authenticated user data for game. Using guest profile.'
        );
        player = {
          name: 'Guest',
          id: null,
          avatar: '/DefaultProfilePic.png',
        };

        const modal = document.getElementById('modal-pong');
        if (modal) {
          modal.classList.remove('hidden');
          const form = document.getElementById('alias-form') as HTMLFormElement;
          if (form)
            form.addEventListener('submit', (e) =>
              onSubmit(e, container, player, form, tournament)
            );
          return;
        }
      }
    } else {
      player = {
        name: 'Guest',
        id: null,
        avatar: '/DefaultProfilePic.png',
      };
      const modal = document.getElementById('modal-pong');
      if (modal) {
        modal.classList.remove('hidden');
        const form = document.getElementById('alias-form') as HTMLFormElement;
        if (form)
          form.addEventListener('submit', (e) =>
            onSubmit(e, container, player, form, tournament)
          );
        return;
      }
    }
    currentWSManager = new WebSocketManager(container, player, tournament);
  } catch (error) {
    console.log(error);
  }
};

const cleanupGame = () => {
  if (currentWSManager) {
    currentWSManager = null;
  }
};

const handleStandardGame = () => mainGame(false);
const handleTournamentGame = () => mainGame(true);

const removeAllEventListeners = () => {
  document.removeEventListener('pongGameLoaded', handleStandardGame);
  document.removeEventListener('pongTournamentLoaded', handleTournamentGame);
  document.removeEventListener('pong:leaving', cleanupGame);
};

const setupEventListeners = () => {
  removeAllEventListeners();

  document.addEventListener('pongGameLoaded', handleStandardGame);
  document.addEventListener('pongTournamentLoaded', handleTournamentGame);
  document.addEventListener('pong:leaving', cleanupGame);
};

setupEventListeners();
