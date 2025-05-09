"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameManager = exports.MatchMaking = void 0;
const uuid_1 = require("uuid");
const DefaultConf_1 = require("./DefaultConf");
const createInitialState_1 = require("./createInitialState");
const PhysicsEngine_1 = require("./PhysicsEngine");
class MatchMaking {
    constructor(gameManagers) {
        this.players = [];
        this.gameManagers = gameManagers;
    }
    addPlayer(socket, name) {
        const player = { id: (0, uuid_1.v4)(), socket, name };
        let newGame = null;
        this.players.push(player);
        if (this.players.length >= 2) {
            const gamePlayers = this.players.slice(0, 2);
            newGame = new GameManager(gamePlayers[0], gamePlayers[1]);
            this.gameManagers.push(newGame);
            this.players = this.players.slice(2);
        }
        return { player: player, game: newGame };
    }
}
exports.MatchMaking = MatchMaking;
class GameManager {
    constructor(player1, player2) {
        this.game = (0, createInitialState_1.createInitialState)();
        this.gameInterval = null;
        this.game.players[0].id = player1.id;
        this.game.players[0].socket = player1.socket;
        this.game.players[0].name = player1.name;
        this.game.paddles[0].id = player1.id;
        this.game.paddles[0].playerName = player1.name;
        this.game.players[1].id = player2.id;
        this.game.players[1].socket = player2.socket;
        this.game.players[1].name = player2.name;
        this.game.paddles[1].id = player2.id;
        this.game.paddles[1].playerName = player2.name;
        this.physicsEngine = new PhysicsEngine_1.PhysicsEngine(DefaultConf_1.defaultConfig);
        this.startGameLoop();
    }
    removePlayer(player) {
        const index = this.game.players.findIndex((p) => {
            return p.id === player.id;
        });
        if (index === -1)
            return;
        // 1. Supprime le joueur
        this.game.players[index].socket = null;
        this.game.players[index].id = "";
        this.game.players[index].name = "";
        // 2. Stoppe le jeu s’il ne reste plus de joueurs actifs
        const activePlayers = this.game.players.filter((p) => {
            return p.socket !== null;
        });
        const activePlayersLen = activePlayers.length;
        if (activePlayersLen < 2) {
            if (this.gameInterval && activePlayersLen !== 0) {
                clearInterval(this.gameInterval);
                this.gameInterval = null;
            }
            // 3. Notifie le joueur restant
            if (activePlayersLen === 1) {
                const remaining = activePlayers[0];
                remaining.socket?.send(JSON.stringify({
                    type: 'playerLeft',
                    data: { message: 'L’autre joueur a quitté la partie.' }
                }));
            }
        }
    }
    handlePlayerInput(player, data) {
        this.physicsEngine.handlePlayerInput(this.game, player, data);
    }
    getPlayers() {
        return this.game.players;
    }
    getPaddles() {
        return this.game.paddles;
    }
    startGame() {
        this.broadcast('start', null);
    }
    startGameLoop() {
        this.gameInterval = setInterval(() => {
            this.physicsEngine.update(this.game);
            const state = {
                paddles: this.game.paddles,
                ball: this.game.ball,
                //		players: this.players.map(p => ({ id: p.id }))
            };
            this.broadcast("update", state);
        }, 1000 / 30); // 30 FPS
    }
    broadcast(type, data) {
        const players = this.getPlayers();
        for (const player of players) {
            if (player.socket) {
                player.socket.send(JSON.stringify({ type: `${type}`, data }));
            }
        }
    }
}
exports.GameManager = GameManager;
