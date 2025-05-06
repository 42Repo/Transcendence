import { getDbReadOnly } from './initDb'

export const getUserById = (id: number) => {
  const db = getDbReadOnly();
  const stmt = db.prepare(
    'SELECT user_id, username, avatar_url FROM users WHERE user_id = ?'
  );
  return stmt.get(id);
};
