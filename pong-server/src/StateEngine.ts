import { Player, StateGame } from "./StateGame";
import { GameManager } from "./pong";

interface RecordMatchBodyForApi {
  player1_id: number | null;
  player2_id: number | null;
  player1_guest_name?: string | null;
  player2_guest_name?: string | null;
  player1_score: number;
  player2_score: number;
  winner_id?: number | null;
  player1_touched_ball: number;
  player1_missed_ball: number;
  player1_touched_ball_in_row: number;
  player1_missed_ball_in_row: number;
  player2_touched_ball: number;
  player2_missed_ball: number;
  player2_touched_ball_in_row: number;
  player2_missed_ball_in_row: number;
}

export class StateEngine {
  private _states: StateGame;
  private _maxTouch: Map<string, number>;
  private _missTouch: Map<string, number>;
  private _gameManager: GameManager;
  private _matchRecorded: boolean = false;

  constructor(gameManager: GameManager, state: StateGame) {
    this._gameManager = gameManager;
    this._states = state;
    this._maxTouch = new Map([
      [this._states.players[0].id, 0],
      [this._states.players[1].id, 0],
    ]);
    this._missTouch = new Map([
      [this._states.players[0].id, 0],
      [this._states.players[1].id, 0],
    ]);
  }

  private isRegisteredUser(playerId: string): boolean {
    return !isNaN(parseInt(playerId, 10));
  }

  private async recordMatch(
    player1Data: Player,
    player2Data: Player,
    winnerData: Player | null
  ) {
    if (this._matchRecorded) return;

    const p1IsRegistered = this.isRegisteredUser(player1Data.id);
    const p2IsRegistered = this.isRegisteredUser(player2Data.id);

    if (!p1IsRegistered && !p2IsRegistered) {
      console.log(
        "[PongServer] Both players are guests. Skipping database record for this match."
      );
      this._matchRecorded = true;
      return;
    }

    const payload: RecordMatchBodyForApi = {
      player1_id: p1IsRegistered ? parseInt(player1Data.id, 10) : null,
      player1_guest_name: p1IsRegistered ? null : player1Data.name,
      player1_score: player1Data.score,
      player1_touched_ball: player1Data.touchedBall,
      player1_missed_ball: player1Data.missedBall,
      player1_touched_ball_in_row: player1Data.touchedBallInRow,
      player1_missed_ball_in_row: player1Data.missedBallInRow,

      player2_id: p2IsRegistered ? parseInt(player2Data.id, 10) : null,
      player2_guest_name: p2IsRegistered ? null : player2Data.name,
      player2_score: player2Data.score,
      player2_touched_ball: player2Data.touchedBall,
      player2_missed_ball: player2Data.missedBall,
      player2_touched_ball_in_row: player2Data.touchedBallInRow,
      player2_missed_ball_in_row: player2Data.missedBallInRow,

      winner_id:
        winnerData && this.isRegisteredUser(winnerData.id)
          ? parseInt(winnerData.id, 10)
          : null,
    };

    try {
      const response = await fetch("http://backend:3000/api/matches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("[PongServer] Match recorded successfully:", result);
        this._matchRecorded = true;
      } else {
        const errorData = await response.text();
        console.error(
          "[PongServer] Failed to record match. Status:",
          response.status,
          "Error:",
          errorData
        );
      }
    } catch (error) {
      console.error("[PongServer] Error sending match data to API:", error);
    }
  }

  public handleGameConclusion(
    winner: Player | null,
    loser: Player | null,
    isForfeit: boolean,
    tournament: boolean,
    draw: boolean = false
  ) {
    if (this._matchRecorded) return;
    console.log(
      `[PongServer] Game concluded. Winner: ${winner?.name || "N/A (Draw/Forfeit)"
      }, Loser: ${loser?.name || "N/A"}, Forfeit: ${isForfeit}, Draw: ${draw}`
    );

    const player1ForPayload = this._states.players[0];
    const player2ForPayload = this._states.players[1];

    let actualWinnerForPayload: Player | null = null;
    if (!draw && winner) {
      actualWinnerForPayload = winner;
    }

    void this.recordMatch(
      player1ForPayload,
      player2ForPayload,
      actualWinnerForPayload
    );
    this._gameManager.gameOver();

    if (draw) {
      player1ForPayload.socket?.send(
        JSON.stringify({ type: "draw", data: { message: "It's a draw!" } })
      );
      player2ForPayload.socket?.send(
        JSON.stringify({ type: "draw", data: { message: "It's a draw!" } })
      );
    } else if (!isForfeit && winner && loser) {
      loser.socket?.send(
        JSON.stringify({
          type: "lose",
          data: { message: `${winner.name} made you bite the dust` },
        })
      );
      if (tournament) {
        winner.socket?.send(
          JSON.stringify({
            type: "wait",
            data: { message: `You beat ${loser.name}` },
          })
        );
      }
      else {
        winner.socket?.send(
          JSON.stringify({
            type: "win",
            data: { message: `You beat ${loser.name}` },
          })
        );
      }
    }
  }

  updateScore(scoringPlayer: Player, tournament: boolean) {
    if (this._matchRecorded) return;

    scoringPlayer.score += 1;
    const otherPlayer: Player = this.getOtherPlayer(scoringPlayer);

    let missedCount = this._missTouch.get(otherPlayer.id) || 0;
    if (!otherPlayer.lastTouch) {
      missedCount++;
      this._missTouch.set(otherPlayer.id, missedCount);
    }
    if (missedCount > otherPlayer.missedBallInRow) {
      otherPlayer.missedBallInRow = missedCount;
    }
    otherPlayer.missedBall += 1;
    otherPlayer.lastTouch = false;

    this._maxTouch.set(otherPlayer.id, 0);

    if (scoringPlayer.score >= 10) {
      this.handleGameConclusion(scoringPlayer, otherPlayer, false, tournament);
    }
  }

  updateTouchedBall(player: Player): void {
    if (this._matchRecorded) return;

    player.touchedBall += 1;
    let currentTouchStreak = this._maxTouch.get(player.id) || 0;

    if (player.lastTouch) {
      currentTouchStreak++;
    } else {
      currentTouchStreak = 1;
    }
    this._maxTouch.set(player.id, currentTouchStreak);

    if (currentTouchStreak > player.touchedBallInRow) {
      player.touchedBallInRow = currentTouchStreak;
    }
    player.lastTouch = true;

    const otherPlayer = this.getOtherPlayer(player);
    if (otherPlayer) {
      otherPlayer.lastTouch = false;
      this._missTouch.set(otherPlayer.id, 0);
    }
  }

  updateTime(start: boolean): void {
    if (start) {
      this._states.time.matchDate = new Date();
    } else if (!this._matchRecorded) {
      this._states.time.matchDuration = this.getElapsedTime();
    }
  }

  public get states(): StateGame {
    return this._states;
  }

  public getElapsedTime(): number {
    const dateNow = new Date();
    const timeNow = dateNow.getTime();
    const timeStart = this._states.time.matchDate.getTime();
    return Math.floor((timeNow - timeStart) / 1000);
  }

  private getOtherPlayer(player: Player): Player {
    return this._states.players.find((p) => p.id !== player.id)!;
  }
}
