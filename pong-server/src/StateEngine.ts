import { Player, StateGame } from './StateGame';

export class StateEngine {
  private _states: StateGame;
  private _maxTouch: Map<string, number>;
  private _missTouch: Map<string, number>;

  constructor(state: StateGame) {
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

  async updatePlayerStates() {
    //update player match in db
  }

  updateScore(player: Player) {
    player.score += 1;
    const otherPlayer: Player = this.getOtherPlayer(player);
    let missed: number | undefined = this._missTouch.get(otherPlayer.id);
    if (!otherPlayer.lastTouch) {
      missed ? missed += 1 : missed = 1;
      this._missTouch.set(otherPlayer.id, missed);
    }
    if (missed && missed > otherPlayer.missedBallInRow) {
      otherPlayer.missedBallInRow = missed;
    }
    otherPlayer.missedBall += 1;
    otherPlayer.lastTouch = false;
  }

  updateTouchedBall(player: Player): void {
    player.touchedBall += 1;
    let numTouch = this._maxTouch.get(player.id);
    if (player.lastTouch) {
      numTouch ? numTouch += 1 : numTouch = 1;
    } else {
      numTouch = 1;
    }
    this._maxTouch.set(player.id, numTouch);
    if (numTouch && numTouch > player.touchedBallInRow) {
      player.touchedBallInRow = numTouch;
    }
    player.lastTouch = true;
  }

  updateTime(start: boolean): void {
    if (start) {
      this._states.time.matchDate = new Date();
    } else {
      const dateNow = new Date();
      const timeNow = dateNow.getTime();
      const timeStart = this._states.time.matchDate.getTime();
      this._states.time.matchDuration = Math.floor((timeNow - timeStart) / 1000);
    }
  }

  public get states(): StateGame {
    return this._states;
  }

  private getOtherPlayer(player: Player): Player {
    return this._states.players.filter((p) => {
      return p.id != player.id;
    })[0];
  }
}
