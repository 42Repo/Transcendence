import Database from 'better-sqlite3';
import path from 'path';

let dbInstance: Database.Database | null = null;

export function getDbReadOnly(): Database.Database {
  if (dbInstance) return dbInstance;

  const dbPath = path.resolve('/app/database/transcendence.db');

  try {
    dbInstance = new Database(dbPath, {
      readonly: true,
      fileMustExist: true,
      verbose: console.log,
    });

    dbInstance.pragma('foreign_keys = ON');
    console.log('Read-only DB connection established from pong-server.');
    return dbInstance;
  } catch (error) {
    console.error('Failed to open DB in read-only mode:', error);
    throw error;
  }
}
