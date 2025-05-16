import { getDbReadOnly } from './initDb'

type Id = {
  user_id: number
};

type UserName = {
  username: string;
}

export interface PlayerAttribute {
  user_id: number;
  username: string;
  avatar_url: string;
};

export interface GameMatch {
  match_id: number;
  player1_id: number | null;
  player2_id: number | null;
  player1_guest_name: string | null;
  player2_guest_name: string | null;
  player1_score: number;
  player2_score: number;
  winner_id: number | null;
  match_date: string;
  player1_touched_ball: number;
  player1_missed_ball: number;
  player1_touched_ball_in_row: number;
  player1_missed_ball_in_row: number;
  player2_touched_ball: number;
  player2_missed_ball: number;
  player2_touched_ball_in_row: number;
  player2_missed_ball_in_row: number;
};

export interface WinStat {
  win: number;
  lose: number;
}

export interface AllMatchStat {
  win: number;
  lose: number;
  touchedBall: number;
  missedBall: number;
  touchedInRow: number;
  missedInRow: number;
  numberMatch: number;
}

export const getUsers = (): UserName[] => {
  const db = getDbReadOnly();
  const stmt = db.prepare(
    'SELECT username FROM users'
  )
  return stmt.all() as UserName[];
};

export const getUserById = (id: number): PlayerAttribute => {
  const db = getDbReadOnly();
  const stmt = db.prepare(
    'SELECT user_id, username, avatar_url FROM users WHERE user_id = ?'
  );
  return stmt.get(id) as PlayerAttribute;
};

const getUserByIdByName = (name: string): Id => {
  const bd = getDbReadOnly();
  const stmt = bd.prepare(
    'SELECT user_id FROM users WHERE username = ?'
  );
  return stmt.get(name) as Id;
}

const getUserMatches = (id: number): GameMatch[] => {
  const db = getDbReadOnly();
  const stmt = db.prepare(
    'SELECT * FROM game_matches WHERE player1_id = ? OR player2_id = ?'
  );
  return stmt.all(id, id) as GameMatch[];
}

export const getUserWinLose = (name: string): WinStat => {
  const playerId: Id = getUserByIdByName(name) as Id;
  if (playerId) {
    const id = playerId.user_id;
    const matches = getUserMatches(id);
    if (!matches) {
      throw new Error(
        JSON.stringify({ message: 'No match found' })
      );
    }
    const result = { win: 0, lose: 0 };
    matches.forEach((match) => {
      if (id === match.winner_id)
        result.win++;
      else
        result.lose++;
    });
    return result;
  } else {
    throw new Error(
      JSON.stringify({ message: `User: ${name} not found` })
    );
  }
};

export const getAllStat = (name: string): AllMatchStat => {
  const playerId: Id = getUserByIdByName(name) as Id;
  if (playerId) {
    const id = playerId.user_id;
    const matches = getUserMatches(id);
    if (!matches) {
      throw new Error(
        JSON.stringify({ message: 'No match found' })
      );
    }
    const result: AllMatchStat = {
      win: 0,
      lose: 0,
      touchedBall: 0,
      missedBall: 0,
      touchedInRow: 0,
      missedInRow: 0,
      numberMatch: 0
    };

    matches.forEach((match: GameMatch) => {
      let player = '';
      if (id === match.player1_id)
        player = 'player1';
      else
        player = 'player2';
      if (id === match.winner_id)
        result.win++;
      else
        result.lose++;
      result.numberMatch++;
      result.touchedBall += match[
        `${player}_touched_ball` as 'player1_touched_ball' || 'player2_touched_ball'
      ] || 0;
      result.missedBall += match[
        `${player}_missed_ball` as 'player1_missed_ball' || 'player2_missed_ball'
      ] || 0;
      const touchedInRow = match[
        `${player}_touched_ball_in_row` as 'player1_touched_ball_in_row' || 'player2_touched_ball_in_row'
      ] || 0;
      result.touchedInRow < touchedInRow ? result.touchedInRow = touchedInRow : null;
      const missedInRow = match[
        `${player}_missed_ball_in_row` as 'player1_missed_ball_in_row' || 'player2_missed_ball_in_row'
      ] || 0;
      result.missedInRow < missedInRow ? result.missedInRow = missedInRow : null;
    });
    return result;
  } else {
    throw new Error(
      JSON.stringify({ message: `User: ${name} not found` })
    );
  }
}
