import { getDbReadOnly } from './initDb'

type Id = {
  user_id: number
};

type UserName = {
  username: string;
};

export const getUserById = (id: number) => {
  const db = getDbReadOnly();
  const stmt = db.prepare(
    'SELECT user_id, username, avatar_url FROM users WHERE user_id = ?'
  );
  return stmt.get(id);
};

export const getUserMatchHistory = (name: string) => {
  const db = getDbReadOnly();
  const playerStmt = db.prepare(
    'SELECT user_id FROM users WHERE username = ?'
  );
  const playerId: Id = (playerStmt.get(name) as Id);
  if (playerId) {
    console.log(playerId);
  }
  const matchHistory = db.prepare(
    'SELECT * FROM game_matches WHERE user_id = ?'
  );
  return matchHistory.get();
};

export const getUsers = (): UserName[] => {
  const db = getDbReadOnly();
  const stmt = db.prepare(
    'SELECT username FROM users'
  )
  return stmt.all() as UserName[];
};
