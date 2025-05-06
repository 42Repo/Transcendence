import { getDbReadOnly } from './initDb'

export const getUserById = (id: number) => {
  const db = getDbReadOnly();
  const stmt = db.prepare('SELECT id, username FROM users WHERE id = ?');
  stmt.get(id);
};
